import {
    catchAsync,
    AppError,
} from "../../middlewares/errorHandler.middleware.js";
import Project from "../../models/project.model.js";

const createProject = catchAsync(async (req, res, next) => {
    // Get project data from request body
    const { ownerId } = req.body;
    const { projectDetails } = req.body;
    const { projectSettings } = req.body;

    // Create new project
    const newProject = new Project({
        ownerId,
        projectDetails,
        projectSettings,
    });

    
    // Save the project and get unhashed credentials
    const savedProject = await newProject.save();
    const projectSecret = savedProject._unhashedProjectSecret;
    
    // Remove sensitive data before sending response
    const projectResponse = savedProject.toObject();
    delete projectResponse._unhashedProjectSecret;
    delete projectResponse.__v;

    // Send response with project secret (only shown once)
    res.status(201).json({
        status: "success",
        message: "Project created successfully",
        data: {
            project: projectResponse,
            credentials: {
                projectId: savedProject.projectCredentials.uid,
                projectSecret: projectSecret,
            },
        },
    });
});

export default createProject;
