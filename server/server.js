import express from "express";
import "dotenv/config"
import cors from 'cors'
import cookieParser from "cookie-parser";


const app = express();

const allowedOrigins = process.env.ORIGINS.split(",")
app.use(cors({origin: "", credentials: true}))
app.use(cookieParser())

app.use(express.json())

app.get("/", (req, res) => res.send("API is live"))


const port = process.env.PORT || 2000;

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})