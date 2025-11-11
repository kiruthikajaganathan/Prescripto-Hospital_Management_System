import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import { Server } from 'socket.io';
import { connectToDatabase } from './config/db.js';
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import recordRoutes from './routes/records.js';
import messageRoutes from './routes/messages.js';
import adminRoutes from './routes/admin.js';
import { notFound, errorHandler } from './middleware/error.js';
import { setupSocket } from './socket.js';
import { ensureAdminIfConfigured } from './utils/ensureAdmin.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*'
	}
});
app.set('io', io);
setupSocket(io);

// Security and performance middlewares
app.use(helmet());
app.use(cors({ origin: '*', credentials: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(xssClean());
app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 300,
		standardHeaders: true,
		legacyHeaders: false
	})
);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => {
	const html = `
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Healthcare API</title>
	<style>
		body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 2rem; line-height: 1.6; }
		h1 { margin-bottom: 0.25rem; }
		.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-top: 1rem; }
		.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; }
		.card h2 { margin: 0 0 .5rem 0; font-size: 1.1rem; }
		code { background: #f3f4f6; padding: .15rem .35rem; border-radius: 4px; }
		a { color: #2563eb; text-decoration: none; }
		a:hover { text-decoration: underline; }
		.small { color: #6b7280; font-size: .9rem; }
	</style>
	<script>
		function curl(method, path, body) {
			const b = body ? ' -H "Content-Type: application/json" -d ' + JSON.stringify(JSON.stringify(body)) : '';
			return 'curl -X ' + method + ' ' + location.origin + path + b;
		}
	</script>
<head>
<body>
	<h1>Healthcare API is running</h1>
	<p class="small">Base URL: <code>\${location.origin}</code> • Health: <a href="/health">/health</a></p>

	<div class="grid">
		<div class="card">
			<h2>Auth</h2>
			<ul>
				<li><a href="#" onclick="alert(curl('POST','/api/auth/register',{name:'Pat',email:'pat@example.com',password:'secret123',role:'patient'}));return false;">POST /api/auth/register</a></li>
				<li><a href="#" onclick="alert(curl('POST','/api/auth/login',{email:'pat@example.com',password:'secret123'}));return false;">POST /api/auth/login</a></li>
				<li><a href="/api/auth/me" target="_blank" rel="noreferrer">GET /api/auth/me</a> <span class="small">(needs Bearer token)</span></li>
			</ul>
		</div>

		<div class="card">
			<h2>Appointments</h2>
			<ul>
				<li><a href="/api/appointments" target="_blank" rel="noreferrer">GET /api/appointments</a> <span class="small">(token)</span></li>
				<li><a href="#" onclick="alert(curl('POST','/api/appointments',{doctorId:'DOCTOR_ID',startTime:'2025-11-12T10:00:00.000Z',endTime:'2025-11-12T10:30:00.000Z'}));return false;">POST /api/appointments</a></li>
			</ul>
		</div>

		<div class="card">
			<h2>Records</h2>
			<ul>
				<li><a href="/api/records" target="_blank" rel="noreferrer">GET /api/records</a> <span class="small">(token)</span></li>
				<li><a href="#" onclick="alert(curl('POST','/api/records',{patientId:'PATIENT_ID',diagnosis:'Hypertension',prescriptions:['Med A'],notes:'Check weekly'}));return false;">POST /api/records</a> <span class="small">(doctor/admin)</span></li>
			</ul>
		</div>

		<div class="card">
			<h2>Messaging</h2>
			<ul>
				<li><a href="#" onclick="alert(curl('POST','/api/messages',{to:'OTHER_USER_ID',content:'Hello'}));return false;">POST /api/messages</a></li>
				<li><a href="/api/messages/thread/OTHER_USER_ID" target="_blank" rel="noreferrer">GET /api/messages/thread/:userId</a></li>
			</ul>
		</div>

		<div class="card">
			<h2>Admin</h2>
			<ul>
				<li><a href="/api/admin/users" target="_blank" rel="noreferrer">GET /api/admin/users</a></li>
				<li><a href="/api/admin/analytics" target="_blank" rel="noreferrer">GET /api/admin/analytics</a></li>
			</ul>
		</div>
	</div>
	<p class="small">Protected endpoints require header: <code>Authorization: Bearer &lt;token&gt;</code></p>
</body>
</html>`;
	res.set('Content-Type', 'text/html; charset=utf-8').send(html);
});
app.get('/favicon.ico', (_req, res) => res.status(204).end());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function start() {
	try {
		await connectToDatabase(MONGO_URI);
		await ensureAdminIfConfigured();
		server.listen(PORT, () => {
			// eslint-disable-next-line no-console
			console.log(`Server listening on http://localhost:${PORT}`);
		});
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Failed to start server', err);
		process.exit(1);
	}
}

start();


