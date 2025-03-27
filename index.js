import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB from "./configs/db.config.js";
import {
    errorHandler,
    catchAsync,
    AppError,
} from "./middlewares/errorHandler.middleware.js";
import b2cRouter from "./routes/b2c.route.js";
import projectRouter from "./routes/project.route.js";

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
app.get(
    "/error",
    catchAsync(async (req, res) => {
        throw new AppError("This is a test error", 400);
    })
);
app.use("/api/b2c/:projectId", b2cRouter);
app.use("/api/b2b/projects", projectRouter);

app.use(errorHandler);

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
