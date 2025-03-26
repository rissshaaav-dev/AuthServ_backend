import {
    catchAsync,
    AppError,
} from "../../middlewares/errorHandler.middleware.js";
import B2C from "../../models/b2c.model.js";
import Project from "../../models/project.model.js";

const b2cSignup = catchAsync(async (req, res, next) => {
    // get suer inputs
    // check for existing user (must not be having the same username and email in a project)
    // create a new user
    // save the user
    // add user to the project and save
    // send 201 response

    // get user inputs
    const { username, email, password, projectId, role } = req.body;

    // check for existing user (must not be having same username and email waithin a project)
    const existingUserCheck = await B2C.findOne({
        projectId,
        $or: [{ username }, { email }],
    });
    if (existingUserCheck) {
        return next(
            new AppError(
                "User with the same username or email already exists in the project.",
                400
            )
        );
    }

    // create a new user
    const newB2c = new B2C({
        username,
        email,
        password,
        projectId,
        role,
    });

    // save the user
    const savedB2c = await newB2c.save();

    // add user to the project and save
    const project = await Project.findOne({
        "projectCredentials.uid": projectId,
    });
    if (!project) {
        return next(new AppError("Project not found.", 404));
    }
    project.users.push(savedB2c._id);
    await project.save();

    // send 201 response
    res.status(201).json({
        success: true,
        message: "User created successfully.",
    });
});

export default b2cSignup;
