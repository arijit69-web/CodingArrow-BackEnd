const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { passwordResetTemplate } = require("../mail/templates/passwordReset");
const { passwordUpdatedTemplate } = require("../mail/templates/passwordUpdate");

exports.resetPasswordToken = async (req, res) => {
	try {
		const email = req.body.email;
		if (!email) {
			return res.status(400).json({
				success: false,
				message: `Please Fill up All the Required Fields`,
			});
		}
		const user = await User.findOne({ email: email });
		if (!user) {
			return res.json({
				success: false,
				message: `This Email: ${email} is Not Registered with us. Enter a Valid Email`,
			});
		}

		// -------- Brute Force ----------

		var token = crypto.randomUUID();
		var result = await User.findOne({ token: token });
		while (result) {
			token = crypto.randomUUID();
			result = await User.findOne({ token: token });
		}

		// ---------------------------------

		const updatedDetails = await User.findOneAndUpdate(
			{ email: email },
			{
				token: token,
				resetPasswordExpires: Date.now() + 3000000,
			},
			{ new: true }
		);

		const url = `${process.env.FRONTEND_URL}/update-password/${token}`;

		await mailSender(
			email,
			"Password Reset Link",
			passwordResetTemplate(updatedDetails.firstName, url)
		);

		res.json({
			success: true,
			message:
				"Email Sent Successfully. Please Check Your Email to Continue Further",
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Sending the Reset Password Mail`,
		});
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const { password, confirmPassword, token } = req.body;
		if (!password || !confirmPassword || !token) {
			return res.status(400).json({
				success: false,
				message: `Please Fill up All the Required Fields`,
			});
		}

		if (confirmPassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does Not Match",
			});
		}
		const userDetails = await User.findOne({ token: token });
		if (!userDetails) {
			return res.json({
				success: false,
				message: "Token is Invalid",
			});
		}
		if (userDetails && (userDetails.resetPasswordExpires < Date.now())) {
			return res.status(403).json({
				success: false,
				message: `Reset Password Token is Expired, Please Regenerate Your Token`,
			});
		}
		const encryptedPassword = await bcrypt.hash(password, 10);
		const updatedUserDetails = await User.findOneAndUpdate(
			{ token: token },
			{ password: encryptedPassword },
			{ new: true }
		);

		const emailResponse = await mailSender(
			updatedUserDetails.email,
			`Password Updated Successfully`,
			passwordUpdatedTemplate(
				`${updatedUserDetails.firstName}`, updatedUserDetails.email

			)
		);
		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}
};