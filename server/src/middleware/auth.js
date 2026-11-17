import jwt from 'jsonwebtoken';
import { UserModel, PatientModel } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'carepal-dev-secret-key-12345';
const COOKIE_NAME = process.env.COOKIE_NAME || 'carepal_session';

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      patientId: user.patientId
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function requireAuth(req, res, next) {
  let token = req.cookies?.[COOKIE_NAME];
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Sign in required to access this resource.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'User account no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Session expired or invalid. Please sign in again.' });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Sign in required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN_ROLE',
        message: `Forbidden: role '${req.user.role}' cannot perform this action.`
      });
    }
    next();
  };
}

export async function requirePatientAccess(req, res, next) {
  const patientId = req.params.id || req.body.patientId || req.query.patientId;
  if (!patientId) {
    return res.status(400).json({ code: 'BAD_REQUEST', message: 'Patient ID is required.' });
  }

  const patient = await PatientModel.findById(patientId);
  if (!patient) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Patient not found.' });
  }

  const isAssignedNurse = (patient.nurseIds || []).includes(req.user._id);
  const isLinkedFamily = (patient.familyIds || []).includes(req.user._id);

  if (!isAssignedNurse && !isLinkedFamily) {
    return res.status(403).json({
      code: 'FORBIDDEN_PATIENT_ACCESS',
      message: 'You are not assigned or linked to this patient.'
    });
  }

  req.patient = patient;
  req.isNurse = isAssignedNurse;
  req.isFamily = isLinkedFamily;
  next();
}
