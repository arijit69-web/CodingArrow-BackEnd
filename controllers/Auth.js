const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdatedTemplate } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();


exports.sendotp = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({
				success: false,
				message: `Please Fill up All the Required Fields`,
			});
		}
		const checkUserPresent = await User.findOne({ email });

		if (checkUserPresent) {
			return res.status(401).json({
				success: false,
				message: `User Already Registered`,
			});
		}
		// -------- Brute Force ----------

		var otp = otpGenerator.generate(6, {
			upperCaseAlphabets: false,
			lowerCaseAlphabets: false,
			specialChars: false,
		});

		var result = await OTP.findOne({ otp: otp });
		while (result) {
			otp = otpGenerator.generate(6, {
				upperCaseAlphabets: false,
				lowerCaseAlphabets: false,
				specialChars: false,
			});
			result = await OTP.findOne({ otp: otp });
		}

		// ---------------------------------

		const otpPayload = { email, otp };
		const otpBody = await OTP.create(otpPayload);
		res.status(200).json({
			success: true,
			message: `OTP Sent Successfully`,
			otp,
		});
	} catch (error) {
		return res.status(500).json({ success: false, error: error.message });
	}
};


exports.signup = async (req, res) => {
	try {
		const {
			firstName,
			lastName,
			email,
			password,
			confirmPassword,
			accountType,
			contactNumber,
			otp,
		} = req.body;
		if (
			!firstName ||
			!lastName ||
			!email ||
			!password ||
			!confirmPassword ||
			!otp
		) {
			return res.status(403).send({
				success: false,
				message: "Please Fill up All the Required Fields",
			});
		}
		if (password !== confirmPassword) {
			return res.status(400).json({
				success: false,
				message:
					"Password and Confirm Password do not match. Please try again.",
			});
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists. Please sign in to continue.",
			});
		}

		// Find the most recent OTP for the email | -1 indicates the sorting order. A value of -1 specifies descending order, meaning that the documents will be sorted in descending order of their createdAt field.
		const responseOTP = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
		if (responseOTP.length === 0) {
			// OTP not found for the email
			return res.status(500).json({
				success: false,
				message: "Server Error: Email Not Registered. Please Try Again",
			});
		} else if (otp !== responseOTP[0].otp) {
			// Invalid OTP
			return res.status(400).json({
				success: false,
				message: "The OTP is Not Valid",
			});
		}

		// Hash the password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create the Additional Profile For User
		const profileDetails = await Profile.create({
			gender: null,
			dateOfBirth: null,
			about: null,
			contactNumber: null,
		});
		const user = await User.create({
			firstName,
			lastName,
			email,
			contactNumber,
			password: hashedPassword,
			accountType: accountType,
			additionalDetails: profileDetails._id,
			image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
		});
		user.password = undefined;

		return res.status(200).json({
			success: true,
			user,
			message: "User Registered Successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "User Cannot be Registered. Please Try Again.",
		});
	}
};


exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: `Please Fill up All the Required Fields`,
			});
		}

		const user = await User.findOne({ email }).populate("additionalDetails");

		if (!user) {
			// Return 401 Unauthorized status code with error message
			return res.status(401).json({
				success: false,
				message: `User is Not Registered`,
			});
		}

		// Generate JWT token and Compare Password
		if (await bcrypt.compare(password, user.password)) {
			const token = jwt.sign(
				{ email: user.email, id: user._id, accountType: user.accountType },
				process.env.JWT_SECRET,
				{
					expiresIn: "24h",
				}
			);

			user.token = token;
			user.password = undefined;
			// Set cookie for token and return success response
			const options = {
				expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
				httpOnly: true,
			};
			res.cookie("token", token, options).status(200).json({
				success: true,
				token,
				user,
				message: `User Loggedin Successfully`,
			});
		} else {
			return res.status(401).json({
				success: false,
				message: `Password is Incorrect`,
			});
		}
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: `Login Failure Please Try Again`,
		});
	}
};


exports.changePassword = async (req, res) => {
	try {
		// Get user data from req.user
		const userDetails = await User.findById(req.user.id);

		// Get old password, new password, and confirm new password from req.body
		const { oldPassword, newPassword, confirmNewPassword } = req.body;

		if (!oldPassword || !newPassword || !confirmNewPassword) {
			return res.status(400).json({
				success: false,
				message: `Please Fill up All the Required Fields`,
			});
		}

		// Validate old password
		const isPasswordMatch = await bcrypt.compare(
			oldPassword,
			userDetails.password
		);
		if (!isPasswordMatch) {
			// If old password does not match, return a 401 (Unauthorized) error
			return res
				.status(401)
				.json({ success: false, message: "The Old Password is Incorrect" });
		}

		// Match new password and confirm new password
		if (newPassword !== confirmNewPassword) {
			return res.status(400).json({
				success: false,
				message: "The Password and Confirm Password Does Not Match",
			});
		}

		// Update password
		const encryptedPassword = await bcrypt.hash(newPassword, 10);
		const updatedUserDetails = await User.findByIdAndUpdate(
			req.user.id,
			{ password: encryptedPassword },
			{ new: true }
		);

		// Send notification email
		try {
			const emailResponse = await mailSender(
				updatedUserDetails.email,
				`Password Updated Successfully`,
				passwordUpdatedTemplate(
					`${updatedUserDetails.firstName}`, updatedUserDetails.email,

				)
			);
		} catch (error) {
			// If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
			return res.status(500).json({
				success: false,
				message: "Error Occurred while Sending Email",
				error: error.message,
			});
		}

		// Return success response
		return res
			.status(200)
			.json({ success: true, message: "Password Updated Successfully" });
	} catch (error) {
		// If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
		return res.status(500).json({
			success: false,
			message: "Error Occurred while Updating Password",
			error: error.message,
		});
	}
};