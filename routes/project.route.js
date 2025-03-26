import { Router } from "express";
import createProject from "../controllers/project.controllers/createProject.controller.js";

const projectRouter = Router();

projectRouter.post("/create", createProject);

export default projectRouter;