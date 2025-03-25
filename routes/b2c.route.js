import { Router } from "express";
import b2cSignup from "../controllers/b2c.controllers/b2cSignup.controller.js";

const b2cRouter = Router();

b2cRouter.post("/signup", b2cSignup);

export default b2cRouter;