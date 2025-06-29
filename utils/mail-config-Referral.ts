import nodemailer from 'nodemailer';

interface SendSettlementReceivedEmailParams {
    email: string;
    referralId: string;
}

async function sendSettlementReceivedEmail({ email, referralId }: SendSettlementReceivedEmailParams): Promise<void> {
    const transporter = nodemailer.createTransport({
        host: 'smtp.zoho.in',
        port: 465,
        secure: true,
        auth: {
            user: 'mail@skillpass.org',
            pass: process.env.MAIL_PASS,
        },
    });

    console.log(`Sending settlement received email to: ${email} for Referral ID: ${referralId}`);

    await transporter.sendMail({
        from: '"Skillpass" <mail@skillpass.org>',
        to: email,
        subject: 'Settlement Request Received',
        text: `Hello,

We have received your settlement request for Referral ID: ${referralId}. Our team will review and process it shortly.

If you have any questions, feel free to contact us at support@skillpass.org.

Thank you,
Team Skillpass`,
    });
}

export { sendSettlementReceivedEmail };
