import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
	// use ObjectId refs for relations
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	docId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },

	// store the slot date as a real date (iso string -> Date)
	slotDate: {
		type: Date,
		required: [true, 'Appointment date is required'],
		validate: {
			validator: function(value) {
				return value instanceof Date && !isNaN(value);
			},
			message: 'Invalid date format'
		}
	},
	slotTime: {
		type: String,
		required: [true, 'Appointment time is required'],
		validate: {
			validator: function(value) {
				// Validate time format (HH:mm)
				return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
			},
			message: 'Invalid time format. Use HH:mm format (e.g., 14:30)'
		}
	},

	// allow any nested object for saved snapshots
	userData: { type: mongoose.Schema.Types.Mixed, required: true },
	docData: { type: mongoose.Schema.Types.Mixed, required: true },

	amount: { type: Number, required: true },

	// use timestamps (createdAt/updatedAt) instead of a numeric date field
	cancelled: { type: Boolean, default: false },
	payment: { type: Boolean, default: false },
	isCompleted: { type: Boolean, default: false }
}, {
	timestamps: true
})

const appointmentModel = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema)
export default appointmentModel