import express from 'express';
import { requireRoles, authRequired } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';

const router = express.Router();

router.use(authRequired, requireRoles('admin'));

router.get('/users', async (_req, res) => {
	const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
	res.json(users);
});

router.get('/analytics', async (_req, res) => {
	const [usersByRole, upcomingAppointments, completedAppointments] = await Promise.all([
		User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
		Appointment.countDocuments({ status: 'scheduled', startTime: { $gte: new Date() } }),
		Appointment.countDocuments({ status: 'completed' })
	]);
	res.json({
		usersByRole,
		upcomingAppointments,
		completedAppointments
	});
});

router.delete('/users/:id', async (req, res) => {
	await User.findByIdAndDelete(req.params.id);
	res.json({ success: true });
});

export default router;


