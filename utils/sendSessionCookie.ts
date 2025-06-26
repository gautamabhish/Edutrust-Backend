export default function sendSessionCookie(res: any, quizId: string): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    maxAge: 5*60* 1000, // 5 minutes in milliseconds
    sameSite: 'Strict', // Adjust as needed
  };

  res.cookie(`sessionId`, quizId, cookieOptions);
}