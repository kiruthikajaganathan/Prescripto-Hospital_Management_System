import express from 'express';
import Joi from 'joi';
import createError from 'http-errors';
import { Record } from '../models/Record.js';
import { authRequired, requireRoles } from '../middleware/auth.js';

const router = express.Router();

const createSchema = Joi.object({
	patientId: Joi.string().required(),
	diagnosis: Joi.string().min(3).required(),
	prescriptions: Joi.array().items(Joi.string()).default([]),
	notes: Joi.string().allow('', null)
});

router.post('/', authRequired, requireRoles('doctor', 'admin'), async (req, res, next) => {
	try {
		const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
		if (error) throw createError(400, error.message);
		const record = await Record.create({
			patient: value.patientId,
			doctor: req.user.id,
			diagnosis: value.diagnosis,
			prescriptions: value.prescriptions,
			notes: value.notes
		});
		res.status(201).json(record);
	} catch (e) {
		next(e);
	}
});

router.get('/', authRequired, async (req, res, next) => {
	try {
		const filter = {};
		if (req.user.role === 'patient') filter.patient = req.user.id;
		if (req.user.role === 'doctor') filter.doctor = req.user.id;
		// admin sees all
		const list = await Record.find(filter).sort({ createdAt: -1 }).populate('patient', 'name').populate('doctor', 'name specialty');
		res.json(list);
	} catch (e) {
		next(e);
	}
});

router.get('/patient/:patientId', authRequired, async (req, res, next) => {
	try {
		const filter = { patient: req.params.patientId };
		if (req.user.role === 'patient' && req.user.id !== req.params.patientId) {
			throw createError(403, 'Cannot view other patients records');
		}
		if (req.user.role === 'doctor') {
			// doctors can view only their created records for that patient
			filter.doctor = req.user.id;
		}
		const list = await Record.find(filter).sort({ createdAt: -1 });
		res.json(list);
	} catch (e) {
		next(e);
	}
});

export default router;


