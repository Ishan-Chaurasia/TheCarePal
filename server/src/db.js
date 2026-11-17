import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let isMongooseConnected = false;

class QueryPromise {
  constructor(data) {
    this._data = JSON.parse(JSON.stringify(data));
  }

  sort(sortCriteria) {
    if (!sortCriteria) return this;
    const key = Object.keys(sortCriteria)[0];
    const dir = sortCriteria[key];
    this._data.sort((a, b) => {
      if (a[key] < b[key]) return dir === 1 ? -1 : 1;
      if (a[key] > b[key]) return dir === 1 ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(n) {
    this._data = this._data.slice(0, n);
    return this;
  }

  lean() {
    return this;
  }

  then(resolve, reject) {
    // Attach ._data to the array itself for backwards compatibility
    const arr = [...this._data];
    arr._data = arr;
    return Promise.resolve(arr).then(resolve, reject);
  }
}

// In-memory / file-backed JSON store
class JsonCollection {
  constructor(name, getStore, saveStore) {
    this.name = name;
    this.getStore = getStore;
    this.saveStore = saveStore;
  }

  _getItems() {
    const store = this.getStore();
    if (!store[this.name]) {
      store[this.name] = [];
    }
    return store[this.name];
  }

  _matches(item, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const key of Object.keys(query)) {
      const qVal = query[key];
      if (qVal && typeof qVal === 'object' && !Array.isArray(qVal)) {
        // Query operators like $in, $gte, $lte, $ne
        if ('$in' in qVal) {
          if (!qVal.$in.includes(item[key])) return false;
        }
        if ('$gte' in qVal) {
          if (item[key] < qVal.$gte) return false;
        }
        if ('$lte' in qVal) {
          if (item[key] > qVal.$lte) return false;
        }
        if ('$ne' in qVal) {
          if (item[key] === qVal.$ne) return false;
        }
      } else {
        if (item[key] !== qVal) return false;
      }
    }
    return true;
  }

  find(query = {}) {
    const items = this._getItems();
    const filtered = items.filter(item => this._matches(item, query));
    return new QueryPromise(filtered);
  }

  async findOne(query = {}) {
    const items = this._getItems();
    const found = items.find(item => this._matches(item, query));
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const store = this.getStore();
    if (!store[this.name]) store[this.name] = [];
    
    const newDoc = {
      _id: doc._id || 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    store[this.name].push(newDoc);
    this.saveStore(store);
    return JSON.parse(JSON.stringify(newDoc));
  }

  async insertMany(docs) {
    const store = this.getStore();
    if (!store[this.name]) store[this.name] = [];
    const created = [];
    for (const doc of docs) {
      const newDoc = {
        _id: doc._id || 'id_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...doc
      };
      store[this.name].push(newDoc);
      created.push(newDoc);
    }
    this.saveStore(store);
    return JSON.parse(JSON.stringify(created));
  }

  async findByIdAndUpdate(id, update, opts = { new: true }) {
    const store = this.getStore();
    const items = store[this.name] || [];
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    const updated = {
      ...items[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    items[index] = updated;
    this.saveStore(store);
    return JSON.parse(JSON.stringify(updated));
  }

  async findByIdAndDelete(id) {
    const store = this.getStore();
    const items = store[this.name] || [];
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    const removed = items.splice(index, 1)[0];
    this.saveStore(store);
    return JSON.parse(JSON.stringify(removed));
  }

  async deleteMany(query = {}) {
    const store = this.getStore();
    if (!store[this.name]) return { deletedCount: 0 };
    const originalCount = store[this.name].length;
    store[this.name] = store[this.name].filter(item => !this._matches(item, query));
    this.saveStore(store);
    return { deletedCount: originalCount - store[this.name].length };
  }

  async countDocuments(query = {}) {
    const items = this._getItems();
    return items.filter(item => this._matches(item, query)).length;
  }
}

class JsonDatabase {
  constructor() {
    this._store = null;
    this._collections = {};
  }

  getStore() {
    if (!this._store) {
      if (fs.existsSync(DATA_FILE)) {
        try {
          this._store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) {
          this._store = {};
        }
      } else {
        this._store = {};
      }
    }
    return this._store;
  }

  saveStore(data) {
    this._store = data;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  getCollection(name) {
    if (!this._collections[name]) {
      this._collections[name] = new JsonCollection(name, () => this.getStore(), (d) => this.saveStore(d));
    }
    return this._collections[name];
  }
}

const localDb = new JsonDatabase();

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (uri && uri.trim() !== '') {
    try {
      console.log('Attempting connection to MongoDB at', uri);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      isMongooseConnected = true;
      console.log('✅ Connected to MongoDB via Mongoose');
      return;
    } catch (err) {
      console.warn('⚠️ Could not connect to external MongoDB, using zero-config embedded store:', err.message);
    }
  } else {
    console.log('ℹ️ No MONGO_URI specified, using zero-config embedded store');
  }
}

export function getDbCollection(name) {
  return localDb.getCollection(name);
}

export { isMongooseConnected };
