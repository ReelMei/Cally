import express from "express";
import "dotenv/config"
import cors from 'cors'
import cookieParser from "cookie-parser";
import { initDB } from "./Config/db.js";
import { clerkMiddleware } from '@clerk/express'
import { handleClerkWebhook } from "./Controllers/webhookController.js";


const app = express();

//Neon Connection and Table Initialization
initDB()

const allowedOrigins = process.env.ORIGINS.split(",")
app.use(cors({origin: "", credentials: true}))
app.use(cookieParser())

app.use('/api/clerk', express.raw({type: 'application/json'}), handleClerkWebhook)

app.use(express.json())
app.use(clerkMiddleware())

app.get("/", (req, res) => res.send("API is live"))


const port = process.env.PORT || 2000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})