import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import authRoutes from "./routes/auth.js";

// Ensure dotenv is loaded before any env usage
import dotenv from 'dotenv';
dotenv.config();

import cloudinary from 'cloudinary';
import { exec } from 'child_process';

// Server configuration - force single port
const PORT = 4000; // Strict port, no fallbacks
const FORCE_KILL = true;
let attemptedKill = false;

// app config
const app = express();

// connect to MongoDB
connectDB();

// middlewares
app.use(express.json());
app.use(cors({
	origin: (origin, callback) => {
		// allow requests from any dev origin (you can restrict to http://localhost:5173 etc.)
		callback(null, true);
	},
	credentials: true
}));

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Cloudinary configuration: validate cloud_name before calling config()
let CLOUDINARY_CONFIGURED = false;

try {
	// Helper: extract cloud name from CLOUDINARY_URL if present
	const extractCloudFromUrl = (url) => {
		if (!url) return null;
		const m = url.match(/@([^/]+)$/);
		return m ? m[1] : null;
	};

	const envCloudName = process.env.CLOUDINARY_CLOUD_NAME || extractCloudFromUrl(process.env.CLOUDINARY_URL);
	const envApiKey = process.env.CLOUDINARY_API_KEY;
	const envApiSecret = process.env.CLOUDINARY_API_SECRET;

	const validName = typeof envCloudName === 'string' && /^[a-zA-Z0-9_-]+$/.test(envCloudName);

	if (validName && envApiKey && envApiSecret) {
		cloudinary.v2.config({
			cloud_name: envCloudName,
			api_key: envApiKey,
			api_secret: envApiSecret,
			secure: true
		});
		CLOUDINARY_CONFIGURED = true;
	} else if (process.env.CLOUDINARY_URL) {
		// Fallback: try to configure directly with CLOUDINARY_URL but validate cloud name first
		const urlCloud = extractCloudFromUrl(process.env.CLOUDINARY_URL);
		if (urlCloud && /^[a-zA-Z0-9_-]+$/.test(urlCloud)) {
			cloudinary.v2.config({ cloudinary_url: process.env.CLOUDINARY_URL });
			CLOUDINARY_CONFIGURED = true;
		} else {
			console.warn('Cloudinary URL present but cloud_name appears invalid. Copy the CLOUDINARY_URL exactly from the Cloudinary dashboard.');
		}
	} else {
		// No config provided
		CLOUDINARY_CONFIGURED = false;
	}
} catch (err) {
	console.warn('Cloudinary configuration error:', err.message || err);
	CLOUDINARY_CONFIGURED = false;
}

if (CLOUDINARY_CONFIGURED) {
	console.log('✅ Cloudinary Connected');
} else {
	console.warn('⚠️ Cloudinary not configured correctly. Uploads will be disabled. Paste the exact CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME/API KEY/API SECRET) from your Cloudinary dashboard into .env and restart.');
}

// Export flag if other modules need it
export { CLOUDINARY_CONFIGURED };

// ensure any upload routes/controllers check CLOUDINARY_CONFIGURED before calling cloudinary.v2.uploader.upload(...)

// quick health route to confirm backend is reachable
app.get('/health', (req, res) => {
	res.json({ success: true, message: 'Backend ok' });
});

function logPortKillInstructions(port) {
	console.error(`❌ Port ${port} is already in use. To free it, run:`);
	console.error('');
	console.error('Windows (PowerShell/CMD):');
	console.error(`  netstat -ano | findstr :${port}`);
	console.error('  // note PID from output, then:');
	console.error(`  taskkill /PID <pid> /F`);
	console.error('');
	console.error('macOS / Linux:');
	console.error(`  lsof -i :${port}`);
	console.error('  // note PID from output, then:');
	console.error('  kill -9 <pid>');
	console.error('');
}

function inspectPortHolder(port, cb) {
	if (process.platform === 'win32') {
		exec(`netstat -ano | findstr :${port}`, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
			cb(err, stdout || stderr || '');
		});
	} else {
		// try lsof; print full lines to help user identify process
		exec(`lsof -i :${port} -n -P`, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
			if (err && !stdout) {
				// fallback to ss if lsof missing
				exec(`ss -ltnp | grep :${port}`, { maxBuffer: 1024 * 1024 }, (e2, s2, st2) => {
					cb(e2 || err, s2 || st2 || '');
				});
			} else {
				cb(err, stdout || stderr || '');
			}
		});
	}
}

function tryKillPidsFromOutput(output) {
	const pids = new Set();
	// For Windows netstat output: last column is PID
	output.split(/\r?\n/).forEach(line => {
		const parts = line.trim().split(/\s+/);
		// Windows netstat: Proto Local Address Foreign Address State PID
		if (process.platform === 'win32' && parts.length >= 5) {
			const pid = parts[parts.length - 1];
			if (/^\d+$/.test(pid)) pids.add(pid);
		} else {
			// lsof format: extract PID column (second column)
			const pidCandidate = parts[1];
			if (pidCandidate && /^\d+$/.test(pidCandidate)) pids.add(pidCandidate);
			// ss output may include pid=1234, parse that
			const m = line.match(/pid=(\d+)/);
			if (m) pids.add(m[1]);
		}
	});

	if (pids.size === 0) return Promise.resolve([]);

	const kills = [];
	return new Promise((resolve) => {
		const killed = [];
		let pending = pids.size;
		pids.forEach(pid => {
			let cmd;
			if (process.platform === 'win32') {
				cmd = `taskkill /PID ${pid} /F`;
			} else {
				cmd = `kill -9 ${pid}`;
			}
			exec(cmd, (err) => {
				if (!err) killed.push(pid);
				pending -= 1;
				if (pending === 0) resolve(killed);
			});
		});
	});
}

function startServer(port) {
    if (port !== 4000) {
        console.error('❌ Only port 4000 is allowed for this application');
        process.exit(1);
    }

    try {
        const server = app.listen(port, () => {
            console.log(`✅ Server started on PORT: ${port}`);
        });
        
        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use.`);
                inspectPortHolder(port, async (inspectErr, output) => {
                    console.error('--- process info ---');
                    console.error(output.trim() || '(no additional info)');
                    console.error('--------------------');
                    
                    if (!attemptedKill) {
                        console.log('Attempting to kill process using port 4000...');
                        attemptedKill = true;
                        const killed = await tryKillPidsFromOutput(output || '');
                        if (killed.length > 0) {
                            console.log(`Killed PID(s): ${killed.join(', ')}. Retrying port 4000...`);
                            setTimeout(() => startServer(4000), 1000);
                        } else {
                            console.error('Could not free port 4000. Please kill the process manually:');
                            logPortKillInstructions(4000);
                            process.exit(1);
                        }
                    } else {
                        console.error('Failed to start server after kill attempt.');
                        logPortKillInstructions(4000);
                        process.exit(1);
                    }
                });
            } else {
                console.error('Server error:', err);
                process.exit(1);
            }
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

// Start server only on port 4000
startServer(4000);
