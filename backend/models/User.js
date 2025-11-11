import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
	// basic user fields
	name: { type: String, trim: true },
	email: { type: String, required: true, unique: true, lowercase: true, trim: true },
	password: { type: String, required: true }, // hashed
	role: { type: String, enum: ['admin', 'doctor', 'user'], default: 'user' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
