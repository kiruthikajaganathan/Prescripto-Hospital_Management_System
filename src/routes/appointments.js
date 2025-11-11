import express from 'express';
import Joi from 'joi';
import createError from 'http-errors';
import { Appointment } from '../models/Appointment.js';
import { requireRoles, authRequired } from '../middleware/auth.js';

const router = express.Router();

const createSchema = Joi.object({
	doctorId: Joi.string().required(),
	startTime: Joi.date().required(),
	endTime: Joi.date().required(),
	notes: Joi.string().allow('', null)
});

router.post('/', authRequired, requireRoles('patient'), async (req, res, next) => {
	try {
		const { value, error } = createSchema.validate(req.body, { stripUnknown: true });
		if (error) throw createError(400, error.message);
		if (new Date(value.endTime) <= new Date(value.startTime)) {
			throw createError(400, 'endTime must be after startTime');
		}
		// Check doctor availability: no overlap
		const overlap = await Appointment.exists({
			doctor: value.doctorId,
			status: 'scheduled',
			$or: [
				{ startTime: { $lt: value.endTime, $gte: value.startTime } },
				{ endTime: { $gt: value.startTime, $lte: value.endTime } },
				{ startTime: { $lte: value.startTime }, endTime: { $gte: value.endTime } }
			]
		});
		if (overlap) throw createError(409, 'Doctor not available in the selected time slot');

		const appt = await Appointment.create({
			patient: req.user.id,
			doctor: value.doctorId,
			startTime: value.startTime,
			endTime: value.endTime,
			notes: value.notes
		});
		res.status(201).json(appt);
	} catch (e) {
		next(e);
	}
});

router.get('/', authRequired, async (req, res, next) => {
	try {
		const filter = {};
		if (req.user.role === 'patient') filter.patient = req.user.id;
		if (req.user.role === 'doctor') filter.doctor = req.user.id;
		// admins see all
		const list = await Appointment.find(filter).sort({ startTime: 1 }).populate('patient', 'name').populate('doctor', 'name specialty');
		res.json(list);
	} catch (e) {
		next(e);
	}
});

const updateSchema = Joi.object({
	startTime: Joi.date().optional(),
	endTime: Joi.date().optional(),
	notes: Joi.string().allow('', null).optional(),
	status: Joi.string().valid('scheduled', 'completed', 'cancelled').optional()
});

router.patch('/:id', authRequired, async (req, res, next) => {
	try {
		const { value, error } = updateSchema.validate(req.body, { stripUnknown: true });
		if (error) throw createError(400, error.message);
		const appt = await Appointment.findById(req.params.id);
		if (!appt) throw createError(404, 'Appointment not found');
		// permissions: patient can update own appt times/notes; doctor can update status/notes; admin any
		const isPatient = req.user.role === 'patient' && appt.patient.toString() === req.user.id;
		const isDoctor = req.user.role === 'doctor' && appt.doctor.toString() === req.user.id;
		const isAdmin = req.user.role === 'admin';
		if (!(isPatient || isDoctor || isAdmin)) throw createError(403, 'Insufficient permissions');

		// If schedule changes, ensure no overlap for doctor's calendar
		const newStart = value.startTime ?? appt.startTime;
		const newEnd = value.endTime ?? appt.endTime;
		if (new Date(newEnd) <= new Date(newStart)) throw createError(400, 'endTime must be after startTime');
		const overlap = await Appointment.exists({
			_id: { $ne: appt.id },
			doctor: appt.doctor,
			status: 'scheduled',
			$or: [
				{ startTime: { $lt: newEnd, $gte: newStart } },
				{ endTime: { $gt: newStart, $lte: newEnd } },
				{ startTime: { $lte: newStart }, endTime: { $gte: newEnd } }
			]
		});
		if (overlap) throw createError(409, 'Doctor not available in the selected time slot');

		Object.assign(appt, value);
		await appt.save();
		res.json(appt);
	} catch (e) {
		next(e);
	}
});

router.delete('/:id', authRequired, async (req, res, next) => {
	try {
		const appt = await Appointment.findById(req.params.id);
		if (!appt) throw createError(404, 'Appointment not found');
		const isPatient = req.user.role === 'patient' && appt.patient.toString() === req.user.id;
		const isDoctor = req.user.role === 'doctor' && appt.doctor.toString() === req.user.id;
		const isAdmin = req.user.role === 'admin';
		if (!(isPatient || isDoctor || isAdmin)) throw createError(403, 'Insufficient permissions');
		appt.status = 'cancelled';
		await appt.save();
		res.json({ success: true });
	} catch (e) {
		next(e);
	}
});

export default router;


