import billingModel from "../models/billingModel.js"
import PDFDocument from "pdfkit"

export const createBill = async (req, res) => {
	try {
		const { userId, docId, appointmentId, type, items, currency } = req.body
		if (!userId || !type || !Array.isArray(items) || items.length === 0) {
			return res.status(400).json({ success: false, message: 'Missing required fields' })
		}
		const total = items.reduce((s, it) => s + Number(it.amount || 0), 0)
		const bill = await billingModel.create({ userId, docId, appointmentId, type, items, total, currency: currency || 'INR' })
		res.json({ success: true, bill })
	} catch (e) {
		console.log(e)
		res.json({ success: false, message: e.message })
	}
}

export const listBills = async (req, res) => {
	try {
		const { userId } = req.query
		const filter = {}
		if (userId) filter.userId = userId
		const bills = await billingModel.find(filter).sort({ createdAt: -1 })
		res.json({ success: true, bills })
	} catch (e) {
		console.log(e)
		res.json({ success: false, message: e.message })
	}
}

export const markPaid = async (req, res) => {
	try {
		const { billId } = req.body
		await billingModel.findByIdAndUpdate(billId, { paid: true })
		res.json({ success: true })
	} catch (e) {
		console.log(e)
		res.json({ success: false, message: e.message })
	}
}

export const downloadInvoicePdf = async (req, res) => {
	try {
		const { billId } = req.params
		const bill = await billingModel.findById(billId)
		if (!bill) return res.status(404).send('Not found')

		res.setHeader('Content-Type', 'application/pdf')
		res.setHeader('Content-Disposition', `attachment; filename=invoice_${billId}.pdf`)
		const doc = new PDFDocument({ size: 'A4', margin: 40 })
		doc.pipe(res)
		doc.fontSize(18).text('RK Hospitals - Invoice', { align: 'center' })
		doc.moveDown()
		doc.fontSize(12).text(`Bill ID: ${billId}`)
		doc.text(`Type: ${bill.type}`)
		doc.text(`Currency: ${bill.currency}`)
		doc.moveDown()
		doc.text('Items:')
		bill.items.forEach((it) => {
			doc.text(`- ${it.description}: ${bill.currency} ${Number(it.amount).toFixed(2)}`)
		})
		doc.moveDown()
		doc.fontSize(14).text(`Total: ${bill.currency} ${Number(bill.total).toFixed(2)}`, { align: 'right' })
		doc.end()
	} catch (e) {
		console.log(e)
		res.status(500).send('Failed to generate PDF')
	}
}

