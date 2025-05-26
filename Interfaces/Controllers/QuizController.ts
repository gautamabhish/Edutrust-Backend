import { Request, Response } from "express";
import { CreateQuiz } from "../../UseCases/Quiz/Create";
import { PrismaQuizRepo } from "../../InfraReps/QuizRepImpl";
import { QuizEntity } from "../../entities/Quiz";
import { GetQuizById } from "../../UseCases/Quiz/GetById";
import { SubmitQuizAttempt } from "../../UseCases/Quiz/Submit";
const quizRepo = new PrismaQuizRepo();
const createQuizUseCase = new CreateQuiz(quizRepo);
const submitAttemptUseCase = new SubmitQuizAttempt(quizRepo);
const getQuizByIdUseCase = new GetQuizById(quizRepo);
export class QuizController {
  static async create(req: Request, res: Response) {
    try {
      const data = new QuizEntity(req.body);
      const quizId = await createQuizUseCase.execute(data);
      res.status(201).json({ success: true, quizId });
    } catch (error) {
      console.error("Create quiz failed", error);
      res.status(500).json({ error: "Failed to create quiz" });
    }
  }

  static async getById  (req: Request, res: Response)  {
  const { id } = req.params;
  try {
    const quiz = await getQuizByIdUseCase.execute(id);
    res.status(200).json(quiz);
  } catch (err: any) {
    res.status(404).json({ message: err.message || "Quiz not found" });
  }
}


static async submitAttempt(req: Request, res: Response) {
  try {
    const result = await submitAttemptUseCase.execute(req.body);
    res.status(200).json({
      message: "Attempt submitted successfully",
      ...result,
    });
  } catch (err) {
    console.error("Submit quiz attempt failed", err);
    res.status(500).json({ error: "Failed to submit attempt" });
  }
}
}
