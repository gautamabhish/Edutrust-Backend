import nodemailer from 'nodemailer';

interface SendOTPEmailParams {
    email: string;
    otp: string;
}

async function sendOTPEmail({ email, otp }: SendOTPEmailParams): Promise<void> {
    const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.in', // replace with actual SMTP host
        port: 465,                  // or 465 for SSL
        secure: true,              // true for port 465, false for 587
        auth: {
            user: 'mail@skillpass.org',      // your email
            pass: process.env.MAIL_PASS, // your email password or app password
        },
    });
    console.log("Sending OTP email to:", otp);

    await transporter.sendMail({
        from: '"Skillpass" <mail@skillpass.org>',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    });
}

export { sendOTPEmail };
