import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";
import { sendMailSafe } from "../utils/mailer.js";


// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {
        // Accept both docId and doctorId from client
        const doctorId = req.body.doctorId || req.body.docId;
        const { userId, slotDate, slotTime } = req.body;
        if (!doctorId || !userId || !slotDate || !slotTime) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Normalize date formats:
        // Supported inputs:
        // - "DD_MM_YYYY" (frontend)
        // - "YYYY-MM-DD"
        let formattedDateObj;
        if (/^\d{1,2}_\d{1,2}_\d{4}$/.test(slotDate)) {
            const [d, m, y] = slotDate.split('_').map(Number);
            formattedDateObj = new Date(y, m - 1, d);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(slotDate)) {
            formattedDateObj = new Date(slotDate);
        } else {
            // try last-resort parse
            const tryDate = new Date(slotDate.replace(/_/g, '-'));
            formattedDateObj = isNaN(tryDate.getTime()) ? null : tryDate;
        }

        if (!formattedDateObj || isNaN(formattedDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use DD_MM_YYYY or YYYY-MM-DD'
            });
        }

        // Normalize time formats:
        // Accept "HH:mm" (24h) or "hh:mm am/pm" (12h) - case-insensitive
        let normalizedTime = null;
        const t = String(slotTime).trim().toLowerCase();
        const match24 = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
        const match12 = t.match(/^(\d{1,2}):([0-5]\d)\s*(am|pm)$/);
        if (match24) {
            normalizedTime = `${match24[1].padStart(2, '0')}:${match24[2]}`;
        } else if (match12) {
            let hour = parseInt(match12[1], 10);
            const minute = match12[2];
            const ampm = match12[3];
            if (ampm === 'pm' && hour !== 12) hour += 12;
            if (ampm === 'am' && hour === 12) hour = 0;
            normalizedTime = `${String(hour).padStart(2, '0')}:${minute}`;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid time format. Use HH:mm or hh:mm am/pm'
            });
        }

        const docData = await doctorModel.findById(doctorId).select("-password")

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        // checking for slot availablity 
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(normalizedTime) || slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot Not Available' })
            }
            else {
                slots_booked[slotDate].push(normalizedTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(normalizedTime)
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId: doctorId,
            userData,
            docData,
            amount: docData.fees,
            slotTime: normalizedTime,
            slotDate: formattedDateObj
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(doctorId, { slots_booked })

        res.json({ success: true, message: 'Appointment Booked' })

        // fire-and-forget email reminder
        try {
            await sendMailSafe({
                to: userData.email,
                from: process.env.MAIL_FROM || 'noreply@rkhospitals.com',
                subject: 'Appointment Confirmation - RK Hospitals',
                text: `Your appointment with Dr. ${docData.name} on ${slotDate} at ${normalizedTime} has been booked.`
            })
        } catch (_e) {}

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { doctorId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(doctorId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(doctorId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}




// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentStripe,
    verifyStripe
}