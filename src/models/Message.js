import mongoose from 'mongoose';

const { Schema } = mongoose;

const MessageSchema = new Schema(
	{
		from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		content: { type: String, required: true },
		readAt: { type: Date }
	},
	{ timestamps: true }
);

MessageSchema.index({ from: 1, to: 1, createdAt: -1 });

export const Message = mongoose.model('Message', MessageSchema);


