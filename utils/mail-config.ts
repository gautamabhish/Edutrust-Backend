import nodemailer from 'nodemailer';
interface SendOTPEmailParams {
    email: string;
    otp: string;
}

async function sendOTPEmail({ email, otp }: SendOTPEmailParams): Promise<void> {
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Or other SMTP provider
        auth: {
            user: 'memebuzzexe@gmail.com',
            pass: 'yvretgkazbtemsrf',
        },
    });

    await transporter.sendMail({
        from: '"Your App" memebuzzexe@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
    });
}
export { sendOTPEmail };
