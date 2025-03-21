const getErrorSource = (error) => {
    if (!error.stack)
        return { file: "Unknown", function: "Unknown", line: "Unknown" };

    const stackLines = error.stack.split("\n");
    // Skip the first line (error message) and get the first actual stack frame
    const sourceLine = stackLines[1] || "";

    let file = "Unknown";
    let lineNumber = "Unknown";
    let functionName = "Unknown";

    // For file path in ESM format: file:///path/to/file.js:line:column
    const esmFileMatch = sourceLine.match(/file:\/\/\/(.*?):(\d+):(\d+)/);
    if (esmFileMatch) {
        const fullPath = esmFileMatch[1];
        file = fullPath.split(/[\/\\]/).pop(); // Extract filename from path
        lineNumber = esmFileMatch[2];
    } else {
        // For file path in CommonJS format: (/path/to/file.js:line:column)
        const cjsFileMatch = sourceLine.match(/\(([^:]+):(\d+):(\d+)\)/);
        if (cjsFileMatch) {
            const fullPath = cjsFileMatch[1];
            file = fullPath.split(/[\/\\]/).pop();
            lineNumber = cjsFileMatch[2];
        }
    }

    // For function name: look at the beginning of the line
    const funcMatch = sourceLine.match(/at\s+([^(]+)\s+\(/);
    if (funcMatch) {
        functionName = funcMatch[1].trim();
    } else if (sourceLine.trim().startsWith("at ")) {
        // If just "at /path" without function name, it's likely global scope
        functionName = "global scope";
    }

    return {
        file,
        function: functionName,
        line: lineNumber,
    };
};


const errorHandler = (err, req, res, next) => {
    // Get status code and default message
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";

    // Get source information
    const source = err.source || getErrorSource(err);

    // Create a decorative console log
    console.error("\n==================================");
    console.error("🔴 ERROR OCCURRED:");
    console.error("----------------------------------");
    console.error(`📋 Status: ${statusCode}`);
    console.error(`💬 Message: ${message}`);
    console.error(`📁 File: ${source.file}`);
    console.error(`⚙️ Function: ${source.function}`);
    console.error(`📄 Line: ${source.line}`);
    console.error("==================================\n");

    // Send JSON response to client
    res.status(statusCode).json({
        success: false,
        status: "error",
        message,
        source: {
            file: source.file,
            function: source.function,
            line: source.line,
        },
    });
};

/**
 * Helper function to wrap async route handlers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Simple custom error class
 */
class AppError extends Error {
    constructor(message, statusCode = 500, source = null) {
        super(message);
        this.statusCode = statusCode;
        this.source = source;

        Error.captureStackTrace(this, this.constructor);
    }
}

export { errorHandler, catchAsync, AppError };
