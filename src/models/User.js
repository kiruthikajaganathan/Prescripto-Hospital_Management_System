import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const UserSchema = new Schema(
	{
		name: { type: String, required: true, trim: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		passwordHash: { type: String, required: true },
		role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true, default: 'patient' },
		// Doctor-specific fields (optional)
		specialty: { type: String },
		// Patient-specific fields (optional)
		dateOfBirth: { type: Date }
	},
	{ timestamps: true }
);

UserSchema.methods.comparePassword = async function (password) {
	return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (password) {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
};

export const User = mongoose.model('User', UserSchema);


