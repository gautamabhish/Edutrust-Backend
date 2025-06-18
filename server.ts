import express from 'express';
import userRoutes from './Interfaces/Routes/userRoutes';
import quizRoutes from './Interfaces/Routes/quizRoutes';
import { paymentRoutes } from './Interfaces/Routes/PaymentRoutes';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
app.use(cookieParser());
app.use(cors(
  {
    origin: ['http://localhost:3000','http://192.168.1.8:3000',"https://skillpass.org","https://skillpass.vercel.app"], // Replace with your client URL
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
));
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Access Blocked ...');
});
app.use('/api/users/auth',userRoutes);
app.use('/api/quiz',quizRoutes );
app.use('/api/payments',paymentRoutes);
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
}
);