import mongoose from "mongoose"

const prescriptionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
	appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
	diagnosis: { type: String, required: true },
	notes: { type: String },
	medicines: [{
		name: { type: String, required: true },
		dosage: { type: String, required: true },
		frequency: { type: String, required: true },
		durationDays: { type: Number, required: true }
	}]
}, { timestamps: true })

const prescriptionModel = mongoose.models.Prescription || mongoose.model("Prescription", prescriptionSchema)
export default prescriptionModel
import mongoose from "mongoose"

const medicineSchema = new mongoose.Schema({
	name: { type: String, required: true },
	dose: { type: String, required: true }, // e.g., 500mg
	frequency: { type: String, required: true }, // e.g., 2 times/day
	duration: { type: String, required: true }, // e.g., 5 days
	notes: { type: String }
}, { _id: false })

const prescriptionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
	appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
	diagnosis: { type: String, required: true },
	medicines: { type: [medicineSchema], default: [] },
	advice: { type: String },
}, { timestamps: true })

const prescriptionModel = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema)
export default prescriptionModel
import mongoose from "mongoose"

const prescriptionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
	appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
	notes: { type: String },
	medicines: [{
		medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
		name: { type: String, required: true },
		dosage: { type: String, required: true }, // e.g. "1-0-1"
		days: { type: Number, default: 5 }
	}]
}, { timestamps: true })

const prescriptionModel = mongoose.models.Prescription || mongoose.model("Prescription", prescriptionSchema)
export default prescriptionModel


