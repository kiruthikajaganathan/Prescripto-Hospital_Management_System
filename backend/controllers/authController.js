import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
	try {
		const { name, email, password, role } = req.body;
		if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

		const existing = await User.findOne({ email });
		if (existing) return res.status(400).json({ message: 'Email already registered' });

		const hashed = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, password: hashed, role });

		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
		return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ message: 'Invalid credentials' });

		const match = await bcrypt.compare(password, user.password);
		if (!match) return res.status(400).json({ message: 'Invalid credentials' });

		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
		return res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
	} catch (err) {
		return res.status(500).json({ message: 'Server error', error: err.message });
	}
};