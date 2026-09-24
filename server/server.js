import express from "express";
import "dotenv/config"
import cors from 'cors'
import http from 'http'
import cookieParser from "cookie-parser";
import { initDB } from "./Config/db.js";
import { clerkMiddleware } from '@clerk/express'
import { handleClerkWebhook } from "./Controllers/webhookController.js";
import meetingRouter from "./Routes/meetingRoutes.js";
import { Server } from "socket.io";
import { setupSocketIO } from "./socket.js";


const app = express();

const server = http.createServer(app)

//Neon Connection and Table Initialization
initDB()

const allowedOrigins = process.env.ORIGINS.split(",")
app.use(cors({origin: "", credentials: true}))
app.use(cookieParser())

app.use('/api/clerk', express.raw({type: 'application/json'}), handleClerkWebhook)

app.use(express.json())
app.use(clerkMiddleware())

app.get("/", (req, res) => res.send("API is live"))
app.use('/api/meetings', meetingRouter)

const io = new Server(server, {
    cors: {origin: allowedOrigins, credentials: true}
})

setupSocketIO(io)


//Global Error Handler
app.use((err, _req, res, _next) => {
    console.error(`[Error] ${err.message}`);
    res.status(500).json({ error: err.message});
})

const port = process.env.PORT || 2000;

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})