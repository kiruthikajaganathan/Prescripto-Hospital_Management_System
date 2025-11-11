import mongoose from "mongoose"

const itemSchema = new mongoose.Schema({
	label: { type: String, required: true },
	amount: { type: Number, required: true }
}, { _id: false })

const billSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	type: { type: String, enum: ['OPD', 'IPD', 'Pharmacy'], required: true },
	referenceId: { type: mongoose.Schema.Types.ObjectId }, // appointment/admission id
	items: [itemSchema],
	total: { type: Number, required: true },
	paid: { type: Boolean, default: false },
	paymentRef: { type: String }
}, { timestamps: true })

const billModel = mongoose.models.Bill || mongoose.model("Bill", billSchema)
export default billModel


