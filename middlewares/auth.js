const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth
exports.auth = async (req, res, next) => {
    try {

        const token = req.cookies.token
            || req.body.token
            || req.header("Authorization").replace("Bearer ", ""); // .replace("Bearer ", ""): This method is used to remove the word "Bearer " from the beginning of the string. In token-based authentication schemes (such as JWT authentication), it's common to prefix the actual token with the word "Bearer ". This is a convention used to indicate the type of authentication token being used. For example, the Authorization header might look like this: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...".

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token is Missing',
            });
        }

        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;
        }
        catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Token is Invalid',
            });
        }
        next();
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Something went Wrong while Validating the Token',
        });
    }
}

//isStudent
exports.isStudent = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: 'This is a Protected Route for Students only',
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'User Role cannot be Verified. Please Try Again'
        })
    }
}


//isInstructor
exports.isInstructor = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: 'This is a Protected Route for Instructor only',
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'User Role cannot be Verified. Please Try Again'
        })
    }
}


//isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        if (req.user.accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: 'This is a Protected Route for Admin only',
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'User Role cannot be Verified. Please Try Again'
        })
    }
}