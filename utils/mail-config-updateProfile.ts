import nodemailer from 'nodemailer';

interface SendSettlementReceivedEmailParams {
    email: string;
}

async function sendProfileUpdateEmail({ email}: SendSettlementReceivedEmailParams): Promise<void> {
    const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.in',
        port: 465,
        secure: true,
        auth: {
            user: 'mail@skillpass.org',
            pass: process.env.MAIL_PASS,
        },
    });

   console.log('Sending profile update email to:', email);
    await transporter.sendMail({
        from: '"Skillpass" <mail@skillpass.org>',
        to: email,
        subject: 'Profile Update Request Received',
        text: `Hello,
        We have received your profile update request for the account with email: ${email}. Our team will review and process it shortly.
        It will take 24-48 hours to process your request.
        you can check the status of your request by logging into your account.
Thank you,
Team Skillpass`,
    });
}

export { sendProfileUpdateEmail };
