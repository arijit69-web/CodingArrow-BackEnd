const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");

exports.capturePayment = async (req, res) => {

    const { courses } = req.body;
    const userId = req.user.id;

    if (courses.length === 0) {
        return res.json({ success: false, message: "Please Provide Course Id" });
    }

    let totalAmount = 0;

    for (const course_id of courses) {
        let course;
        try {

            course = await Course.findById(course_id);
            if (!course) {
                return res.status(400).json({ success: false, message: "Could Not Find the Course: ", course_id });
            }


            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                return res.status(400).json({ success: false, message: "Student is Already Enrolled" });
            }

            totalAmount += course.price;
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    const currency = "INR";
    const options = {
        amount: totalAmount * 100,
        currency,
        receipt: Date.now().toString() + "_" + userId,
    }

    try {
        const paymentResponse = await instance.orders.create(options);
        res.json({
            success: true,
            message: paymentResponse,
        })
    }
    catch (error) {
        return res.status(500).json({ success: false, mesage: "Could Not Initiate Order" });
    }

}

// Capturing Payment
/*
Imagine you're buying something online using a credit card. When you hit the "pay" button, your bank needs to confirm that you have enough money to make the purchase. That's the authorization step.
Now, even though the bank says "yes, you can buy it," the money doesn't actually move from your account to the seller's account right away. Payment capture is the step where that money actually gets taken from your account and given to the seller.
So, payment capture is like the moment when the seller gets paid for what you bought. It's essential because it ensures the seller gets the money they're owed for the stuff or services they provided.
*/
exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;
    const userId = req.user.id;

    if (!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
        return res.status(400).json({ success: false, message: "Payment Failed" });
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

    /*
        The secret key plays a crucial role in ensuring the security and integrity of the payment data exchanged between your server and Razorpay. By using this key to generate and verify signatures, you can be confident that the payment details are genuine and haven't been tampered with during the transmission process. This helps in maintaining trust between you, as the merchant, and Razorpay as the payment processor, allowing for timely and secure transactions. 
        So, payment capture is like the moment when the seller gets paid for what you bought. It's essential because it ensures the seller gets the money they're owed for the stuff or services they provided.
        */
    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res);
        return res.status(200).json({ success: true, message: "Payment Verified" });
    }
    return res.status(400).json({ success: false, message: "Payment Failed" });

}


const enrollStudents = async (courses, userId, res) => {

    if (!courses || !userId) {
        return res.status(400).json({ success: false, message: "Please Provide Data for Courses or UserId" });
    }

    for (const courseId of courses) {
        try {
            const enrolledCourse = await Course.findOneAndUpdate(
                { _id: courseId },
                { $push: { studentsEnrolled: userId } },
                { new: true },
            )

            if (!enrolledCourse) {
                return res.status(400).json({ success: false, message: "Unable to Enroll Student in Courses" });
            }

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [],
            })

            const enrolledStudent = await User.findByIdAndUpdate(userId,
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id,
                    }
                }, { new: true })

            const emailResponse = await mailSender(
                enrollStudents.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(enrolledCourse.courseName, `${updatedUserDetails.firstName}`)
            )
        }
        catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

}
