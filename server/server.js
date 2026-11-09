import express from "express";
import "dotenv/config"
import cors from 'cors'
import http from 'http'
import cookieParser from "cookie-parser";
import { initDB, testDB } from "./Config/db.js";
import { clerkMiddleware, verifyToken } from '@clerk/express'
import { handleClerkWebhook } from "./Controllers/webhookController.js";
import meetingRouter from "./Routes/meetingRoutes.js";
import turnRouter from "./Routes/turnRoutes.js";
import { Server } from "socket.io";
import { setupSocketIO } from "./socket.js";


const app = express();

const server = http.createServer(app)

if (!process.env.ORIGINS) {
    throw new Error("ORIGINS is not defined in environment variables (comma separated list of allowed client URLs)");
}
const allowedOrigins = process.env.ORIGINS.split(",").map(origin => origin.trim()).filter(Boolean);

app.use(cors({origin: allowedOrigins, credentials: true}))
app.use(cookieParser())

app.use('/api/clerk', express.raw({type: 'application/json'}), handleClerkWebhook)

app.use(express.json())
app.use(clerkMiddleware())

app.get("/", (req, res) => res.send("API is live"))
app.use('/api/meetings', meetingRouter)
app.use('/api/turn', turnRouter)

const io = new Server(server, {
    cors: {origin: allowedOrigins, credentials: true}
})

// Authenticate every socket with the Clerk session token sent by the client
// (socket.auth.token). The verified user id is the only identity trusted later.
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));

        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });

        socket.data.userId = payload.sub;
        next();
    } catch (error) {
        console.error('Socket auth failed:', error.message || error);
        next(new Error('Authentication failed'));
    }
})

setupSocketIO(io)


//Global Error Handler
app.use((err, _req, res, _next) => {
    console.error(`[Error] ${err.message}`);
    res.status(500).json({ error: err.message});
})

const port = process.env.PORT || 2000;

// Make sure tables exist before accepting traffic
try {
    await initDB();
    await testDB();
} catch (error) {
    console.error('Database initialization failed, exiting.', error);
    process.exit(1);
}

server.listen(port, () => {
    console.log(`Server is running at ${port}`)
})
