import express from 'express';
import Joi from 'joi';
import createError from 'http-errors';
import { Message } from '../models/Message.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

const sendSchema = Joi.object({
	to: Joi.string().required(),
	content: Joi.string().min(1).max(5000).required()
});

router.post('/', authRequired, async (req, res, next) => {
	try {
		const { value, error } = sendSchema.validate(req.body, { stripUnknown: true });
		if (error) throw createError(400, error.message);
		const msg = await Message.create({
			from: req.user.id,
			to: value.to,
			content: value.content
		});
		// emit via socket if available
		req.app.get('io')?.to(value.to).emit('message:new', {
			_id: msg.id,
			from: req.user.id,
			to: value.to,
			content: msg.content,
			createdAt: msg.createdAt
		});
		res.status(201).json(msg);
	} catch (e) {
		next(e);
	}
});

router.get('/thread/:userId', authRequired, async (req, res, next) => {
	try {
		const otherId = req.params.userId;
		const msgs = await Message.find({
			$or: [
				{ from: req.user.id, to: otherId },
				{ from: otherId, to: req.user.id }
			]
		})
			.sort({ createdAt: 1 });
		res.json(msgs);
	} catch (e) {
		next(e);
	}
});

router.post('/:id/read', authRequired, async (req, res, next) => {
	try {
		const msg = await Message.findById(req.params.id);
		if (!msg) throw createError(404, 'Message not found');
		if (msg.to.toString() !== req.user.id) throw createError(403, 'Cannot mark others messages');
		msg.readAt = new Date();
		await msg.save();
		res.json({ success: true });
	} catch (e) {
		next(e);
	}
});

export default router;


