import nodemailer from 'nodemailer';

interface SendSettlementReceivedEmailParams {
  email: string;
  amount: number;
  name?: string; // optional, default to 'User' if not provided
  requestedAt?: Date;
}

async function sendSettlementReceivedEmailForQuiz({
  email,
  name = 'User', // default to 'User' if name is not provided
  amount,
  requestedAt = new Date(), // default to now if not provided
}: SendSettlementReceivedEmailParams): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,
    auth: {
      user: 'mail@skillpass.org',
      pass: process.env.MAIL_PASS,
    },
  });

  const formattedDate = requestedAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  console.log(`Sending settlement received email to: ${email} for amount: ₹${amount}`);

  await transporter.sendMail({
    from: '"Skillpass" <mail@skillpass.org>',
    to: email,
    subject: 'Your Settlement Request Has Been Received',
    text: `Dear ${name},

We have received your settlement request for an amount of ₹${amount.toFixed(2)} on ${formattedDate}.
The amount is inclusive of all the quiz payments made for You.
Our team will process your request within 72 hours and notify you once it is settled.
The amount will be verified and transferred to your account as per our policies.
A confirmation email will be sent once the settlement is going to Complete.

If you have any questions, feel free to contact us at support@skillpass.org.

Thank you,
Team Skillpass`,
  });
}

export { sendSettlementReceivedEmailForQuiz };
