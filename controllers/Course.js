const Course = require("../models/Course")
const Category = require("../models/Category")
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
const User = require("../models/User")
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const CourseProgress = require("../models/CourseProgress")


// Function to create a new course
exports.createCourse = async (req, res) => {
    try {
        const userId = req.user.id // Fetching the user id from the req that have been added in the Auth middleware @ Line no. 22

        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            tag: _tag,
            category,
            status,
            instructions: _instructions,
        } = req.body
        // Get thumbnail image from request files
        const thumbnail = req.files.thumbnailImage

        // Convert the tag and instructions from stringified Array to Array
        const tag = JSON.parse(_tag)
        const instructions = JSON.parse(_instructions)

        // Check if any of the required fields are missing
        if (
            !courseName ||
            !courseDescription ||
            !whatYouWillLearn ||
            !price ||
            !tag.length ||
            !thumbnail ||
            !category ||
            !instructions.length
        ) {
            return res.status(400).json({
                success: false,
                message: "All Fields are Mandatory",
            })
        }

        if (!status || status === undefined) {
            status = "Draft"
        }

        // Check if the user is an instructor
        const instructorDetails = await User.findById(userId, {
            accountType: "Instructor",
        })

        if (!instructorDetails) {
            return res.status(400).json({
                success: false,
                message: "Instructor Details Not Found",
            })
        }

        // Check if the category given is valid
        if (!categoryDetails) {
            return res.status(400).json({
                success: false,
                message: "Category Details Not Found",
            })
        }
        // Upload the Thumbnail to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(
            thumbnail,
            process.env.FOLDER_NAME
        )
        // Create a new course with the given details
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            status: status,
            instructions,
            studentsEnrolled: [instructorDetails._id],
        })

        // Add the new course to the User Schema of the Instructor as that User aka Instructor is the owner of that course. So add that course in his course list
        await User.findByIdAndUpdate(
            {
                _id: instructorDetails._id,
            },
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            { new: true }
        )
        // Add the new course to the Categories
        const categoryDetails2 = await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    courses: newCourse._id,
                },
            },
            { new: true }
        )
        // Return the new course and a success message
        res.status(200).json({
            success: true,
            data: newCourse,
            message: "Course Created Successfully",
        })
    } catch (error) {
        // Handle any errors that occur during the creation of the course
        res.status(500).json({
            success: false,
            message: "Failed to Create the Course",
            error: error.message,
        })
    }
}

exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find(
            {},
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true,
            }
        )
            .populate("instructor")
            .exec()

        return res.status(200).json({
            success: true,
            message: `Courses Fetched Successfully`,
            data: allCourses,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to Fetch the Courses`,
            error: error.message,
        })
    }
}

exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "-videoUrl",
                },
            })
            .exec()

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could Not Find Course with ID: ${courseId}`,
            })
        }

        if (courseDetails.status === "Draft" && req.user.accountType === "Student") {
            return res.status(403).json({
                success: false,
                message: `Accessing a Draft Course is Forbidden`,
            });
        }

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec()

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })


        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could Not Find Course with ID: ${courseId}`,
            })
        }

        if (courseDetails.status === "Draft" && req.user.accountType === "Student") {
            return res.status(403).json({
                success: false,
                message: `Accessing a Draft Course is Forbidden`,
            });
        }

        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos
                    ? courseProgressCount?.completedVideos
                    : [],
            },
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}