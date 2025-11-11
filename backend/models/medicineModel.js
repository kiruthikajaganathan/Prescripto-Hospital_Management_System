import mongoose from "mongoose"

const medicineSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	sku: { type: String, unique: true, sparse: true },
	batch: { type: String, trim: true },
	expiryDate: { type: Date },
	stock: { type: Number, default: 0 },
	price: { type: Number, default: 0 },
}, { timestamps: true })

const medicineModel = mongoose.models.Medicine || mongoose.model("Medicine", medicineSchema)
export default medicineModel


