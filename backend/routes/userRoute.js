import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, paymentStripe, verifyStripe } from '../controllers/userController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
import { listPrescriptions } from '../controllers/prescriptionController.js';
import { createBill, listBills, markPaid, downloadInvoicePdf } from '../controllers/billingController.js';
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)

// prescriptions for user
userRouter.get("/prescriptions", authUser, listPrescriptions)

// billing
userRouter.post("/billing", authUser, createBill)
userRouter.get("/billing", authUser, listBills)
userRouter.post("/billing/mark-paid", authUser, markPaid)
userRouter.get("/billing/:billId/invoice.pdf", authUser, downloadInvoicePdf)

export default userRouter;