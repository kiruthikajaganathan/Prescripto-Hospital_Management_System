import jwt from 'jsonwebtoken';
import createError from 'http-errors';
import { User } from '../models/User.js';

export function authRequired(req, res, next) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;
	if (!token) {
		return next(createError(401, 'Authentication required'));
	}
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;
		return next();
	} catch (_e) {
		return next(createError(401, 'Invalid or expired token'));
	}
}

export function requireRoles(...roles) {
	return async function (req, res, next) {
		if (!req.user) return next(createError(401, 'Authentication required'));
		if (!roles.includes(req.user.role)) return next(createError(403, 'Insufficient permissions'));
		// optional: ensure user still exists
		const exists = await User.exists({ _id: req.user.id, role: req.user.role });
		if (!exists) return next(createError(401, 'User no longer exists'));
		return next();
	};
}


