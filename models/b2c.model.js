// fileds needed: username, password, email, projectId, role, refreshTokens[]
// indexes needed: (username, projectId), (email, projectId)
// pre-save hook needed: hashPassword
// methods needed: comparePassword, generateAccessToken, generateAndSaveRefreshToken, regenerateRefreshToken, revokeRefreshToken, revokeAllRefreshTokens

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { AppError } from "../middlewares/errorHandler.middleware";
import jwt from "jsonwebtoken";

const b2cSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    projectId: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: false,
    },
    refreshTokens: {
        type: [String],
        required: false,
    },
});

b2cSchema.index({ username: 1, projectId: 1 }, { unique: true });
b2cSchema.index({ email: 1, projectId: 1 }, { unique: true });

// Pre-save hook to hash password
b2cSchema.pre("save", async function (next) {
    // Only hash the password if it's modified (or new)
    if (!this.isModified("password")) return next();

    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password along with our new salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

b2cSchema.methods = {
    comparePassword: async function (password) {
        return await bcrypt.compare(password, this.password);
    },
    generateAccessToken: function () {
        // check if the environment variables are defined
        // generate an access token and return it

        // check if the environment variables are defined
        if (
            !process.env.B2C_ACCESS_JWT_SECRET ||
            !process.env.B2C_ACCESS_JWT_EXPIRES_IN
        ) {
            throw new AppError(
                "Access JWT secret or expiration time is not defined",
                500,
                {
                    file: "b2cSchema.js",
                    function: "generateAccessToken",
                    line: "66",
                }
            );
        }

        // generate an access token and return it
        return jwt.sign({ id: this._id }, process.env.B2C_ACCESS_JWT_SECRET, {
            expiresIn: process.env.B2C_ACCESS_JWT_EXPIRES_IN,
        });
    },
    generateAndSaveRefreshToken: async function () {
        // check if the environment variables are defined
        // generate a refresh token
        // add the refresh token to the refreshTokens array
        // save the document and return the refresh token

        // check if the environment variables are defined
        if (
            !process.env.B2C_REFRESH_JWT_SECRET ||
            !process.env.B2C_REFRESH_JWT_EXPIRES_IN
        ) {
            throw new AppError(
                "Refresh JWT secret or expiration time is not defined",
                500,
                {
                    file: "b2cSchema.js",
                    function: "generateAndSaveRefreshToken",
                    line: "93",
                }
            );
        }

        // generate a refresh token
        const refreshToken = jwt.sign(
            { id: this._id },
            process.env.B2C_REFRESH_JWT_SECRET,
            {
                expiresIn: process.env.B2C_REFRESH_JWT_EXPIRES_IN,
            }
        );

        // add the refresh token to the refreshTokens array
        this.refreshTokens.push(refreshToken);

        // save the document and return the refresh token
        await this.save();
        return refreshToken;
    },
    regenerateRefreshToken: async function (refreshToken) {
        // verify the signature of the token
        // check if the token is in the refreshToken array
        // if yes, remove the token from the array
        // generate a new refresh token and add it to the array using generateAndSaveRefreshToken (automatically saves the document)
        // return the new refresh token

        // verify the signature of the token
        try {
            jwt.verify(refreshToken, process.env.B2C_REFRESH_JWT_SECRET);
        } catch (err) {
            throw new AppError("Invalid refresh token", 401, {
                file: "b2cSchema.js",
                function: "regenerateRefreshToken",
                line: "133",
            });
        }

        // check if the token is in the refreshToken array
        if (!this.refreshTokens.includes(refreshToken)) {
            throw new AppError("Refresh token not found", 404, {
                file: "b2cSchema.js",
                function: "regenerateRefreshToken",
                line: "143",
            });
        }

        // if yes, remove the token from the array
        this.refreshTokens = this.refreshTokens.filter(
            (token) => token !== refreshToken
        );

        // generate a new refresh token and add it to the array
        const newRefreshToken = await this.generateAndSaveRefreshToken();

        // return the new refresh token
        return newRefreshToken;
    },
    revokeRefreshToken: async function (refreshToken) {
        // verify the signature of the token
        // check if the token is in the refreshToken array
        // if yes, remove the token from the array
        // save the document

        // verify the signature of the token
        try {
            jwt.verify(refreshToken, process.env.B2C_REFRESH_JWT_SECRET);
        } catch (err) {
            throw new AppError("Invalid refresh token", 401, {
                file: "b2cSchema.js",
                function: "revokeRefreshToken",
                line: "170",
            });
        }

        // check if the token is in the refreshToken array
        if (!this.refreshTokens.includes(refreshToken)) {
            throw new AppError("Refresh token not found", 404, {
                file: "b2cSchema.js",
                function: "revokeRefreshToken",
                line: "180",
            });
        }

        // if yes, remove the token from the array
        this.refreshTokens = this.refreshTokens.filter(
            (token) => token !== refreshToken
        );

        // save the document
        await this.save();

        return true;
    },
    revokeAllRefreshTokens: async function () {
        // remove all refresh tokens from the array
        // save the document

        // remove all refresh tokens from the array
        this.refreshTokens = [];

        // save the document
        await this.save();

        return true;
    },
};

const B2C = mongoose.model("B2C", b2cSchema);
export default B2C;
