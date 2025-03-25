// fields needed: ownerId, projectDetails (name, description, logo), projectCredentials (uid, secret), projectSetings (roles, permissions, authMethods, socialLogins, passwordPolicy, redirectUrl, authUrl), userList[], status, isDeleted
// indexes needed: (ownerId, projectCredentials.uid)
// pre-save hook needed: generateProjectCredentials
// methods needed: authenticateProject, regenerateProjectSecret, revokeProjectCredentials, deleteProject

import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { AppError } from "../middlewares/errorHandler.middleware.js";

const projectSchema = new mongoose.Schema({
    ownerId: {
        type: String,
        required: true,
    },
    projectDetails: {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        logo: {
            type: String,
            required: false,
        },
    },
    projectCredentials: {
        uid: {
            type: String,
            required: true,
        },
        secret: {
            type: String,
            required: true,
        },
    },
    projectSettings: {
        roles: [
            {
                roleName: {
                    type: String,
                    required: true,
                },
                permissions: {
                    type: [String],
                    default: [],
                },
            },
        ],
        authMethods: {
            emailLogin: { type: Boolean, default: false, required: true },
            usernameLogin: { type: Boolean, default: true, required: true },
        },
        socialLogin: {
            google: { type: Boolean, default: false, required: true },
            github: { type: Boolean, default: false, required: true },
        },
        passwordPolicy: {
            minLength: { type: Number, default: 8, required: true },
            requireNumbers: { type: Boolean, default: false, required: true },
            requireSpecialCharacters: {
                type: Boolean,
                default: false,
                required: true,
            },
            requireUppercase: { type: Boolean, default: false, required: true },
        },
        redirectUrl: {
            type: String,
            required: true,
            default: "http://localhost:3000",
        },
        authUrl: {
            type: String,
            required: false,
        },
    },
    users: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    status: {
        type: String,
        enum: ["active", "inactive"],
        required: true,
        default: "active",
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false,
    },
});

projectSchema.index(
    { ownerId: 1, "projectCredentials.uid": 1 },
    { unique: true }
);

projectSchema.pre("save", async function (next) {
    try {
        // Only generate project credentials if it's new
        if (!this.isNew) {
            return next();
        }

        // Generate a unique project id using nanoid after checking if it's not alreadt present
        if (!this.projectCredentials.projectId) {
            this.projectCredentials.projectId = `prj${nanoid(12)}`;
        }

        // Generate a unique project secret using crypto and hash it before saving using bcrypt
        if (!this.projectCredentials.projectSecret) {
            const uniqueSecret = crypto.randomBytes(16).toString("hex");

            // Attach the unhashed secret to the instance to return it to the user but only once
            this._unhashedProjectSecret = uniqueSecret;
            this.projectCredentials.projectSecret = await bcrypt.hash(
                uniqueSecret,
                10
            );
        }
        next();
    } catch (error) {
        next(new AppError("Error generating project credentials", 500));
    }
});

projectSchema.methods = {
    authenticateProject: async function (secret) {
        try {
            return await bcrypt.compare(secret, this.projectCredentials.secret);
        } catch (error) {
            throw new AppError("Error authenticating project", 500);
        }
    },

    regenerateProjectSecret: async function () {
        try {
            const uniqueSecret = crypto.randomBytes(16).toString("hex");
            this._unhashedProjectSecret = uniqueSecret;
            this.projectCredentials.secret = await bcrypt.hash(
                uniqueSecret,
                10
            );
            await this.save();
            return this._unhashedProjectSecret;
        } catch (error) {
            throw new AppError("Error regenerating project secret", 500);
        }
    },

    revokeProjectCredentials: async function () {
        try {
            this.projectCredentials.secret = null;
            await this.save();
        } catch (error) {
            throw new AppError("Error revoking project credentials", 500);
        }
    },

    deleteProject: async function () {
        try {
            this.isDeleted = true;
            await this.save();
        } catch (error) {
            throw new AppError("Error deleting project", 500);
        }
    },
};

const Project = mongoose.model("Project", projectSchema);
export default Project;
