import express from "express";
import userRouter from "./interfaces/Controller/UserController";
import { createQuizController } from "./interfaces/Controller/QuizController";
import { Request } from "express";
import cors from 'cors'
const app = express();
app.use(cors())
app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/quiz",createQuizController)

export default app;
