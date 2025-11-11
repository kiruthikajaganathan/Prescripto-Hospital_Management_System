import mongoose from "mongoose"

const bedSchema = new mongoose.Schema({
	label: { type: String, required: true },
	ward: { type: String, required: true }, // e.g., General, ICU
	isOccupied: { type: Boolean, default: false }
}, { timestamps: true })

const admissionSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
	bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
	admitDate: { type: Date, default: Date.now },
	dischargeDate: { type: Date },
	diagnosis: { type: String },
	dailyNotes: [{
		date: { type: Date, default: Date.now },
		note: { type: String }
	}]
}, { timestamps: true })

export const bedModel = mongoose.models.Bed || mongoose.model("Bed", bedSchema)
export const admissionModel = mongoose.models.Admission || mongoose.model("Admission", admissionSchema)


