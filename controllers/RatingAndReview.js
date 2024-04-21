const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { mongo, default: mongoose } = require("mongoose");

exports.createRating = async (req, res) => {
    try {

        const userId = req.user.id;
        const { rating, review, courseId } = req.body;

        if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating is Required and must be a Number between 1 and 5.',
            });
        }
        if (!review) {
            return res.status(400).json({
                success: false,
                message: 'Review is Required',
            });
        }

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is required',
            });
        }
        const courseDetails = await Course.findOne(
            {
                _id: courseId,
                studentsEnrolled: { $elemMatch: { $eq: userId } },
            });

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: 'Student is Not Enrolled in the Course',
            });
        }
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });
        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: 'Course is Already Reviewed by the User',
            });
        }
        const ratingReview = await RatingAndReview.create({
            rating, review,
            course: courseId,
            user: userId,
        });

        const updatedCourseDetails = await Course.findByIdAndUpdate({ _id: courseId },
            {
                $push: {
                    ratingAndReviews: ratingReview._id,
                }
            },
            { new: true });
        return res.status(200).json({
            success: true,
            message: "Rating and Review Created Successfully",
            ratingReview,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}



exports.getAverageRating = async (req, res) => {
    try {
        const courseId = req.body.courseId;

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID is Required.',
            });
        }

        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                }
            }
        ])

        if (result.length > 0) {

            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })

        }

        return res.status(200).json({
            success: true,
            message: 'Average Rating is 0 | No Ratings',
            averageRating: 0,
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}



exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "course",
                select: "courseName",
            })
            .exec();
        return res.status(200).json({
            success: true,
            message: "All Reviews Fetched Successfully",
            data: allReviews,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}