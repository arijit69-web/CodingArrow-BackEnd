const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        })


        let info = await transporter.sendMail({
            from: 'Coding Arrow',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        })
        return info;
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}


module.exports = mailSender;