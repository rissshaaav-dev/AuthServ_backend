// extract projectId from the request params
// extract projectSecret from the request header (Authorization bearer)
// search for project using projectId
// validate project using authenticateProject method defined in the project model
// if valid, get project from database
// create an object with projectId and settings
// attach the object to the request body

import Project from "../models/project.model.js";
import { catchAsync, AppError } from "./errorHandler.middleware.js";

const validateProjectMiddleware = catchAsync(async (req, res, next) => {
    // Extract projectId from params
    const { projectId } = req.params;    
    if (!projectId) {
        throw new AppError("Project ID is required", 400);
    }

    // Extract projectSecret from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Authorization header missing or invalid", 401);
    }

    const projectSecret = authHeader.split(" ")[1];
    if (!projectSecret) {
        throw new AppError("Project secret is required", 401);
    }

    // search for project using projectId
    const project = await Project.findOne({
        "projectCredentials.uid": projectId,
        isDeleted: false,
    });
    if (!project) {
        throw new AppError("Project not found", 404);
    }

    // Validate project using authenticateProject method
    const isValid = await project.authenticateProject(projectSecret);
    if (!isValid) {
        throw new AppError("Invalid project credentials", 401);
    }

    // create an object with projectId and settings
    const projectResponse = {
        projectId: project.projectCredentials.uid,
        settings: project.projectSettings,
    };

    // attach the object to the request body
    req.body.projectData = projectResponse;

    next();
});

export default validateProjectMiddleware;