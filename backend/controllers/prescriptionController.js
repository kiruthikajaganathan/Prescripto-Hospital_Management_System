import prescriptionModel from "../models/prescriptionModel.js"

// Doctor creates a prescription
export const createPrescription = async (req, res) => {
	try {
		const { userId, diagnosis, notes, medicines, appointmentId } = req.body
		const docId = req.body.docId || req.body.doctorId || req.doctorId
		if (!docId || !userId || !diagnosis || !Array.isArray(medicines) || medicines.length === 0) {
			return res.status(400).json({ success: false, message: 'Missing required fields' })
		}
		const rx = await prescriptionModel.create({ userId, docId, diagnosis, notes, medicines, appointmentId })
		res.json({ success: true, prescription: rx })
	} catch (e) {
		console.log(e)
		res.json({ success: false, message: e.message })
	}
}

// List prescriptions for a user (patient) or by doctor
export const listPrescriptions = async (req, res) => {
	try {
		const { forUserId, forDoctorId } = req.query
		const filter = {}
		if (forUserId) filter.userId = forUserId
		if (forDoctorId) filter.docId = forDoctorId
		const list = await prescriptionModel.find(filter).sort({ createdAt: -1 })
		res.json({ success: true, prescriptions: list })
	} catch (e) {
		console.log(e)
		res.json({ success: false, message: e.message })
	}
}


