const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.updateProfile = async (req, res) => {
    try {
        const { dateOfBirth = "", about = "", contactNumber, gender = "" } = req.body;
        const id = req.user.id;

        // Find the profile by id
        const userDetails = await User.findById(id);
        const profile = await Profile.findById(userDetails.additionalDetails);

        // Update the profile fields
        profile.dateOfBirth = dateOfBirth;
        profile.about = about;
        profile.contactNumber = contactNumber;
        profile.gender = gender;

        // Save the updated profile
        await profile.save();

        return res.json({
            success: true,
            message: "Profile Updated Successfully",
            profile,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};



exports.deleteAccount = async (req, res) => {
    try {

        const id = req.user.id;

        const user = await User.findById({ _id: id });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User Not Found",
            });
        }

        // Delete Assosiated Profile with the User
        await Profile.findByIdAndDelete({ _id: user.additionalDetails });

        // Unenroll User From All the Enrolled Courses
        const enrolledCourses = user.courses;

        for (const courseId of enrolledCourses) {
            await Course.findByIdAndUpdate(courseId, {
                $pull: {
                    studentsEnrolled: id
                }
            })
        }



        // Now Delete User
        await User.findByIdAndDelete({ _id: id });
        res.status(200).json({
            success: true,
            message: "User Deleted Successfully",
        });
    } catch (error) {
        res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
};


exports.getUserDetails = async (req, res) => {
    try {
        const id = req.user.id;
        const userDetails = await User.findById(id)
            .populate("additionalDetails")
            .exec();
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "User Not Found",
            });
        }
        userDetails.password = undefined;

        res.status(200).json({
            success: true,
            message: "User Data Fetched Successfully",
            data: userDetails,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      if (!displayPicture) {
        return res.status(400).json({
            success: false,
            message: `Please Fill up All the Required Fields`,
        });
    }
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      updatedProfile.password = undefined;

      res.send({
        success: true,
        message: `Image Updated Successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};