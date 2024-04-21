const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

exports.createSubSection = async (req, res) => {
    try {
        const { sectionId, title, description } = req.body
        const video = req.files.video

        if (!sectionId || !title || !description || !video) {
            return res
                .status(400)
                .json({ success: false, message: "All Fields are Mandatory" })
        }

        // Upload the video file to Cloudinary
        const uploadDetails = await uploadImageToCloudinary(
            video,
            process.env.FOLDER_NAME
        )
        // Create a new sub-section with the necessary information
        const SubSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        })

        // Update the corresponding section with the newly created sub-section
        const updatedSection = await Section.findByIdAndUpdate(
            { _id: sectionId },
            { $push: { subSection: SubSectionDetails._id } },
            { new: true }
        ).populate("subSection")

        return res.status(200).json({ success: true, data: updatedSection })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        })
    }
}


exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description } = req.body
        const subSection = await SubSection.findById(subSectionId)

        if (!subSection) {
            return res.status(400).json({
                success: false,
                message: "SubSection Not Found",
            })
        }

        if (title !== undefined) {
            subSection.title = title
        }

        if (description !== undefined) {
            subSection.description = description
        }
        if (req.files && req.files.video !== undefined) {
            const video = req.files.video
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME
            )
            subSection.videoUrl = uploadDetails.secure_url
            subSection.timeDuration = `${uploadDetails.duration}`
        }

        await subSection.save()

        const updatedSection = await Section.findById(sectionId).populate("subSection")


        return res.json({
            success: true,
            data: updatedSection,
            message: "Section Updated Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
}

exports.deleteSubSection = async (req, res) => {
    try {
        const { subSectionId, sectionId } = req.body
        await Section.findByIdAndUpdate(
            { _id: sectionId },
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )
        const subSection = await SubSection.findByIdAndDelete({ _id: subSectionId })

        if (!subSection) {
            return res
                .status(400)
                .json({ success: false, message: "SubSection Not Found" })
        }

        const updatedSection = await Section.findById(sectionId).populate("subSection")

        return res.json({
            success: true,
            data: updatedSection,
            message: "SubSection Deleted Successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
}