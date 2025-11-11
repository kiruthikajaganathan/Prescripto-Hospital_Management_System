import mongoose from "mongoose"

const billingSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
	appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
	type: { type: String, enum: ['OPD', 'IPD'], required: true },
	items: [{
		description: { type: String, required: true },
		amount: { type: Number, required: true }
	}],
	total: { type: Number, required: true },
	paid: { type: Boolean, default: false },
	currency: { type: String, default: 'INR' }
}, { timestamps: true })

const billingModel = mongoose.models.Billing || mongoose.model("Billing", billingSchema)
export default billingModel

