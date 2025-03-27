// extract user inputs from the request body
// validate them based on the project settings attached to the request body
// on success, pass the inputs to the next middleware

import { catchAsync, AppError } from "./errorHandler.middleware.js";

const validateB2cInput = catchAsync(async (req, res, next) => {
    const { username, email, password, role } = req.body;

    const { settings } = req.body.projectData;

    const USERNAME_REGEX = /^(?![._])[a-z0-9]+(?:[._][a-z0-9]+)*$/;
    if (username && !username.match(USERNAME_REGEX)) {
        return next(new AppError("Username not valid", 400));
    }

    const EMAIL_REGEX =
        /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !email.match(EMAIL_REGEX)) {
        return next(
            new AppError("Invalid email format or email not present", 400)
        );
    }

    // Password validation
    if (!password) {
        return next(new AppError("Password is required", 400));
    }
    const passwordValidations = [
        {
            condition: password.length < settings.passwordPolicy.minLength,
            message: `Password must be at least ${settings.passwordPolicy.minLength} characters long`,
        },
        {
            condition:
                settings.passwordPolicy.requireNumbers && !/\d/.test(password),
            message: "Password must contain at least one number",
        },
        {
            condition:
                settings.passwordPolicy.requireSpecialCharacters &&
                !/[!@#$%^&*(),.?":{}|<>]/.test(password),
            message: "Password must contain at least one special character",
        },
        {
            condition:
                settings.passwordPolicy.requireUppercase &&
                !/[A-Z]/.test(password),
            message: "Password must contain at least one uppercase letter",
        },
    ];

    for (const validation of passwordValidations) {
        if (validation.condition) {
            return next(new AppError(validation.message, 400));
        }
    }

    // Validate role if provided
    if (role) {
        const validRoles = settings.roles.map((r) => r.roleName);
        if (!validRoles.includes(role)) {
            return next(
                new AppError(
                    `Invalid role. Must be one of: ${validRoles.join(", ")}`,
                    400
                )
            );
        }
    }
    
    next();
});

export default validateB2cInput;
