import nodemailer from 'nodemailer'

export function createTransport() {
	const host = process.env.SMTP_HOST
	const port = Number(process.env.SMTP_PORT || 587)
	const user = process.env.SMTP_USER
	const pass = process.env.SMTP_PASS
	if (!host || !user || !pass) {
		// fallback to console transport
		return null
	}
	return nodemailer.createTransport({ host, port, auth: { user, pass } })
}

export async function sendMailSafe(options) {
	const transporter = createTransport()
	if (!transporter) {
		// eslint-disable-next-line no-console
		console.log('Mailer not configured; would send:', options.subject)
		return
	}
	await transporter.sendMail(options)
}

