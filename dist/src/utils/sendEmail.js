"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendEmail(options) {
    // Create transporter using Gmail
    const transporter = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // Gmail App Password
        },
    });
    // Email options
    const mailOptions = {
        from: `"FocusAI Task Manager" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
    };
    // Send email
    try {
        // Basic diagnostics to help troubleshoot email sending
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('EMAIL_USER or EMAIL_PASS is missing from environment');
        }
        // Verify transporter configuration before sending
        await transporter.verify();
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}`);
    }
    catch (error) {
        console.error('Error sending email:', error);
        // Provide a clearer hint when Gmail blocks sign-ins or credentials are invalid
        console.error('Email diagnostics:', {
            emailUserSet: !!process.env.EMAIL_USER,
            emailPassSet: !!process.env.EMAIL_PASS,
            to: options.to,
            subject: options.subject,
        });
        throw error;
    }
}
