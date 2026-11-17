import { getDbCollection } from '../db.js';

export const UserModel = getDbCollection('users');
export const PatientModel = getDbCollection('patients');
export const MedicineScheduleModel = getDbCollection('medicineSchedule');
export const EntryModel = getDbCollection('entries');
export const EntryAuditModel = getDbCollection('entryAudit');
export const AlertModel = getDbCollection('alerts');
