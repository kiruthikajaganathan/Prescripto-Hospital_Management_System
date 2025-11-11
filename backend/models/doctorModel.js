import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: false },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: Number, required: true, default: 0 },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true, default: 0 },
    slots_booked: { type: mongoose.Schema.Types.Mixed, default: {} },
    address: { type: mongoose.Schema.Types.Mixed, required: true },
    date: { type: Date, default: Date.now },
}, { minimize: false, timestamps: true });

const doctorModel = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
export default doctorModel;