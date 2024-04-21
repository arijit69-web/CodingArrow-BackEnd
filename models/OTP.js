const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const otpTemplate = require("../mail/templates/emailVerification");
const OTPSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 60 * 5, // The document/data will be automatically deleted after 5 minutes of its creation time from the DB
	},
});

async function sendVerificationEmail(email, otp) {

	try {
		const mailResponse = await mailSender(
			email,
			"Email Verification",
			otpTemplate(otp)
		);
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
}
/*
Before a new document (OTP) is created and saved to the database, the pre-save middleware is triggered.
Inside the pre-save middleware, the verification email is sent using the sendVerificationEmail function.
If the email is sent successfully (i.e., no errors are encountered), the document is then saved to the database.
If an error occurs during the email sending process, the error is caught and logged, and the error is propagated to the caller.
*/

// OTPSchema.pre("save", ...) specifies that the middleware function should be executed before a document is saved
OTPSchema.pre("save", async function (next) {// In Mongoose, when the "save" operation is triggered on a Mongoose model instance, any pre-save middleware `async function (next) {}` attached to the schema will be executed first. If you have an asynchronous pre-save middleware function, it will execute asynchronously. Once the asynchronous tasks inside the middleware function are complete, you call the next() function to proceed with the saving process.

	// if (this.isNew): This condition ensures that the email is sent only when a new document is being created, not when an existing document is updated.
	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
	next();
});

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;