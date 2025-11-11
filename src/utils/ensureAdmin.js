import { User } from '../models/User.js';

export async function ensureAdminIfConfigured() {
	const email = process.env.ADMIN_EMAIL;
	const password = process.env.ADMIN_PASSWORD;
	if (!email || !password) {
		return;
	}
	const existing = await User.findOne({ email });
	if (existing) {
		return;
	}
	const passwordHash = await User.hashPassword(password);
	await User.create({
		name: 'Administrator',
		email,
		passwordHash,
		role: 'admin'
	});
	// eslint-disable-next-line no-console
	console.log(`Admin user created: ${email}`);
}


