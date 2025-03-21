import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB from "./configs/db.config.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
});

app.use("/authserv", limiter);

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on PORT ${PORT} 🚀`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to the database ❌:", err.message);
        process.exit(1);
    });
