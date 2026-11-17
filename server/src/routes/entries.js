import express from 'express';
import { z } from 'zod';
import { requireAuth, requirePatientAccess, requireRole } from '../middleware/auth.js';
import { EntryModel, EntryAuditModel, AlertModel } from '../models/index.js';
import { checkVitalOutOfRange } from '../utils/vitalRanges.js';

const router = express.Router();

// Validation schema for entry creation
const entryCreateSchema = z.object({
  kind: z.enum(['vital', 'meal', 'medicine', 'activity', 'mood', 'observation', 'note']),
  at: z.string().optional(),
  day: z.string().optional(),
  time: z.string().optional(),
  data: z.record(z.any()),
  clientId: z.string().optional(),
  photos: z.array(z.string()).optional()
});

// POST /api/patients/:id/entries
router.post('/:id/entries', requireAuth, requireRole(['nurse']), requirePatientAccess, async (req, res) => {
  try {
    const parse = entryCreateSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid entry payload.',
        errors: parse.error.format()
      });
    }

    const { kind, data, clientId, photos } = parse.data;
    const now = new Date();
    const at = parse.data.at || now.toISOString();
    const day = parse.data.day || at.substring(0, 10);
    const time = parse.data.time || at.substring(11, 16);

    // De-duplication check for offline sync (clientId)
    if (clientId) {
      const existing = await EntryModel.findOne({ clientId });
      if (existing) {
        return res.status(200).json({
          message: 'Entry already recorded previously via client ID.',
          entry: existing,
          deduplicated: true
        });
      }
    }

    // Process kind-specific logic
    let processedData = { ...data };
    let shouldAlert = false;
    let alertReason = '';

    if (kind === 'vital') {
      const vt = data.vitalType;
      const rangeCheck = checkVitalOutOfRange(vt, data.value, data);
      processedData.isOutOfRange = rangeCheck.isOutOfRange;
      processedData.status = rangeCheck.status;
      processedData.crossedEdge = rangeCheck.crossedEdge || '';
      processedData.band = rangeCheck.band || '';

      if (rangeCheck.isOutOfRange) {
        shouldAlert = true;
        alertReason = `Vital reading out of range: ${vt} recorded as ${data.vitalType === 'bloodPressure' ? `${data.systolic}/${data.diastolic} mmHg` : `${data.value} ${data.unit || ''}`} (${rangeCheck.crossedEdge})`;
      }
    } else if (kind === 'medicine') {
      if (data.status === 'missed') {
        shouldAlert = true;
        alertReason = `Scheduled medication missed: ${data.medicineName} (${data.dose}) - Reason: "${data.reason || 'Not specified'}"`;
      }
    }

    const newEntry = await EntryModel.create({
      patientId: req.patient._id,
      kind,
      at,
      day,
      time,
      data: processedData,
      authorId: req.user._id,
      authorName: req.user.name,
      photos: photos || [],
      clientId: clientId || null,
      isDeleted: false
    });

    // Handle alert generation if needed
    if (shouldAlert) {
      await AlertModel.create({
        entryId: newEntry._id,
        patientId: req.patient._id,
        reason: alertReason,
        recipients: req.patient.familyIds || [],
        sentAt: new Date().toISOString()
      });
      console.log(`[ALERT DISPATCHED] -> To Family for ${req.patient.name}: ${alertReason}`);
    }

    res.status(201).json({
      success: true,
      entry: newEntry
    });
  } catch (err) {
    console.error('Error creating entry:', err);
    res.status(500).json({
      code: 'SAVE_FAILED',
      message: "Couldn't save the entry. What you typed is still here. Try again."
    });
  }
});

// PATCH /api/patients/:id/entries/:entryId
router.patch('/:id/entries/:entryId', requireAuth, requireRole(['nurse']), requirePatientAccess, async (req, res) => {
  try {
    const { entryId } = req.params;
    const existing = await EntryModel.findById(entryId);

    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Entry not found.' });
    }

    // Author check
    if (existing.authorId !== req.user._id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only edit entries you authored.' });
    }

    // Same-day check (entries can only be edited on the calendar day of care)
    const today = new Date().toISOString().substring(0, 10);
    if (existing.day !== today) {
      return res.status(403).json({
        code: 'EDIT_EXPIRED',
        message: 'Entries can only be edited on the same calendar day of care.'
      });
    }

    const beforeSnapshot = JSON.parse(JSON.stringify(existing));

    let updatedData = { ...existing.data, ...(req.body.data || {}) };
    if (existing.kind === 'vital') {
      const vt = updatedData.vitalType;
      const rangeCheck = checkVitalOutOfRange(vt, updatedData.value, updatedData);
      updatedData.isOutOfRange = rangeCheck.isOutOfRange;
      updatedData.status = rangeCheck.status;
      updatedData.crossedEdge = rangeCheck.crossedEdge || '';
      updatedData.band = rangeCheck.band || '';
    }

    const updated = await EntryModel.findByIdAndUpdate(entryId, {
      data: updatedData,
      time: req.body.time || existing.time,
      at: req.body.at || existing.at,
      photos: req.body.photos || existing.photos,
      editedAt: new Date().toISOString()
    });

    // Record audit trail
    await EntryAuditModel.create({
      entryId: existing._id,
      editorId: req.user._id,
      editorName: req.user.name,
      at: new Date().toISOString(),
      action: 'EDIT',
      before: beforeSnapshot,
      after: updated
    });

    res.json({
      success: true,
      entry: updated
    });
  } catch (err) {
    console.error('Error updating entry:', err);
    res.status(500).json({ code: 'UPDATE_FAILED', message: "Failed to update entry." });
  }
});

// DELETE /api/patients/:id/entries/:entryId
router.delete('/:id/entries/:entryId', requireAuth, requireRole(['nurse']), requirePatientAccess, async (req, res) => {
  try {
    const { entryId } = req.params;
    const existing = await EntryModel.findById(entryId);

    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Entry not found.' });
    }

    // Author check
    if (existing.authorId !== req.user._id) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only delete entries you authored.' });
    }

    // Same-day check
    const today = new Date().toISOString().substring(0, 10);
    if (existing.day !== today) {
      return res.status(403).json({
        code: 'DELETE_EXPIRED',
        message: 'Entries can only be deleted on the same calendar day of care.'
      });
    }

    // Soft delete
    const deleted = await EntryModel.findByIdAndUpdate(entryId, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });

    // Record audit trail
    await EntryAuditModel.create({
      entryId: existing._id,
      editorId: req.user._id,
      editorName: req.user.name,
      at: new Date().toISOString(),
      action: 'DELETE',
      before: existing,
      after: null
    });

    res.json({
      success: true,
      message: 'Entry removed successfully.'
    });
  } catch (err) {
    console.error('Error deleting entry:', err);
    res.status(500).json({ code: 'DELETE_FAILED', message: "Failed to delete entry." });
  }
});

// GET /api/patients/:id/entries/:entryId/audit
router.get('/:id/entries/:entryId/audit', requireAuth, requirePatientAccess, async (req, res) => {
  const audits = (await EntryAuditModel.find({ entryId: req.params.entryId }))._data || [];
  audits.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  res.json(audits);
});

export default router;
