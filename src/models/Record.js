import mongoose from 'mongoose';

const { Schema } = mongoose;

const RecordSchema = new Schema(
	{
		patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		diagnosis: { type: String, required: true },
		prescriptions: [{ type: String }],
		notes: { type: String }
	},
	{ timestamps: true }
);

RecordSchema.index({ patient: 1, createdAt: -1 });

export const Record = mongoose.model('Record', RecordSchema);


