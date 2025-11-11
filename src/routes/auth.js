import express from 'express';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { User } from '../models/User.js';
import { authRequired } from '../middleware/auth.js';
import createError from 'http-errors';

const router = express.Router();

const registerSchema = Joi.object({
	name: Joi.string().min(2).max(100).required(),
	email: Joi.string().email().required(),
	password: Joi.string().min(6).required(),
	role: Joi.string().valid('patient', 'doctor', 'admin').default('patient'),
	specialty: Joi.string().allow('', null),
	dateOfBirth: Joi.date().optional()
});

router.post('/register', async (req, res, next) => {
	try {
		const { value, error } = registerSchema.validate(req.body, { stripUnknown: true });
		if (error) throw createError(400, error.message);

		const existing = await User.findOne({ email: value.email });
		if (existing) throw createError(409, 'Email already registered');

		const passwordHash = await User.hashPassword(value.password);
		const user = await User.create({
			name: value.name,
			email: value.email,
			passwordHash,
			role: value.role,
			specialty: value.specialty,
			dateOfBirth: value.dateOfBirth
		});
		res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
	} catch (e) {
		next(e);
	}
});

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required()
});

router.post('/login', async (req, res, next) => {
	try {
		const { value, error } = loginSchema.validate(req.body);
		if (error) throw createError(400, error.message);

		const user = await User.findOne({ email: value.email });
		if (!user) throw createError(401, 'Invalid credentials');
		const ok = await user.comparePassword(value.password);
		if (!ok) throw createError(401, 'Invalid credentials');

		const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
			expiresIn: process.env.JWT_EXPIRES_IN || '7d'
		});
		res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
	} catch (e) {
		next(e);
	}
});

router.get('/me', authRequired, async (req, res, next) => {
	try {
		const me = await User.findById(req.user.id).select('-passwordHash');
		if (!me) return next(createError(404, 'User not found'));
		res.json(me);
	} catch (e) {
		next(e);
	}
});

export default router;


