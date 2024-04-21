const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

exports.createSection = async (req, res) => {
	try {
		const { sectionName, courseId } = req.body;

		if (!sectionName || !courseId) {
			return res.status(400).json({
				success: false,
				message: "All Fields are Mandatory",
			});
		}

		// Create a new section with the given name
		const newSection = await Section.create({ sectionName });

		// Add the new section to the course's content array
		const updatedCourse = await Course.findByIdAndUpdate(
			courseId,
			{
				$push: {
					courseContent: newSection._id,
				},
			},
			{ new: true }
		)
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		// The populate: { path: "subSection" } specifies that the subSection field within each item of the courseContent array should also be populated.

		// Return the updated course object in the response
		res.status(200).json({
			success: true,
			message: "Section Created Successfully",
			updatedCourse,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal Server Error",
			error: error.message,
		});
	}
};


exports.updateSection = async (req, res) => {
	try {
		const { sectionName, sectionId, courseId } = req.body;
		const section = await Section.findByIdAndUpdate(
			sectionId,
			{ sectionName },
			{ new: true }
		);

		const course = await Course.findById(courseId)
			.populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();

		res.status(200).json({
			success: true,
			message: section,
			data: course,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal Server Error",
		});
	}
};


exports.deleteSection = async (req, res) => {
	try {

		const { sectionId, courseId } = req.body;
		await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId, // Removing the Course Content/Section Content of a given sectionId from the Course Table
			}
		})
		const section = await Section.findById(sectionId);
		if (!section) {
			return res.status(400).json({
				success: false,
				message: "Section Not Found",
			})
		}

		//Delete sub section
		await SubSection.deleteMany({ _id: { $in: section.subSection } });

		await Section.findByIdAndDelete(sectionId);

		//Find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path: "courseContent",
			populate: {
				path: "subSection"
			}
		})
			.exec();

		res.status(200).json({
			success: true,
			message: "Section Deleted",
			data: course
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Internal Server Error",
		});
	}
};   