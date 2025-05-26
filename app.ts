import express from "express";
import userRouter from "./interfaces/Controller/UserController";
// import { QuizController } from "./interfaces/Controller/QuizController";
import { Request } from "express";
import cors from 'cors'
import { quizController } from "./interfaces/Controller/QuizController";

const app = express();
app.use(cors())
app.use(express.json());
app.use("/api/users", userRouter);
app.use('/api/quiz',quizController)

export default app;
