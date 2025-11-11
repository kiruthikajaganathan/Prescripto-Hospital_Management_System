import mongoose from 'mongoose';

const { Schema } = mongoose;

const AppointmentSchema = new Schema(
	{
		patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },
		status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
		notes: { type: String }
	},
	{ timestamps: true }
);

AppointmentSchema.index({ doctor: 1, startTime: 1, endTime: 1 });
AppointmentSchema.index({ patient: 1, startTime: 1 });

export const Appointment = mongoose.model('Appointment', AppointmentSchema);


