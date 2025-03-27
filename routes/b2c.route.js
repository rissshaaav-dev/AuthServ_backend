import { Router } from "express";
import b2cSignup from "../controllers/b2c.controllers/b2cSignup.controller.js";
import validateProjectMiddleware from "../middlewares/validateProject.middleware.js";
import validateB2cInput from "../middlewares/validateB2cInput.middleware.js";

const b2cRouter = Router({ mergeParams: true });

b2cRouter.post(
    "/signup",
    validateProjectMiddleware, // if success, gets project from database and sends projectId and settings to the next middleware
    validateB2cInput, // based on the settings provided by the previous middleware, validates user inputs
    b2cSignup
);

export default b2cRouter;
