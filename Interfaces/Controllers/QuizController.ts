import { Request, Response } from "express";
import { CreateQuiz } from "../../UseCases/Quiz/Create";
import { PrismaQuizRepo } from "../../InfraReps/QuizRepImpl";
import { QuizEntity } from "../../entities/Quiz";
import { GetQuizById } from "../../UseCases/Quiz/GetById";
import { GetQuizByIdPaid } from "../../UseCases/Quiz/GetByIdPaid";
import { SubmitQuizAttempt } from "../../UseCases/Quiz/Submit";
import { GetQuizByTitle } from "../../UseCases/Quiz/GetQuizByTitle";
const quizRepo = new PrismaQuizRepo();
const createQuizUseCase = new CreateQuiz(quizRepo);
const submitAttemptUseCase = new SubmitQuizAttempt(quizRepo);
const getQuizByIdUseCase = new GetQuizById(quizRepo);
const GetQuizByIdPaidCase = new GetQuizByIdPaid(quizRepo);
const getQuizByTitleUseCase = new GetQuizByTitle(quizRepo);
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

  static async getByIdPaid  (req: any, res: Response)  {
  const { id  } = req.params;
  const userId = req.user?.id; // Assuming user ID is available in req.user
  try {
    const quiz = await GetQuizByIdPaidCase.execute(id ,userId );
    res.status(200).json(quiz);
  } catch (err: any) {
    if(err.message === "Access denied") return res.status(403).json({ message: err.message });
    res.status(404).json({ message: err.message || "Quiz not found" });
  }
}


static async submitAttempt(req: any, res: Response) {
  try {
    // console.log("Submitting quiz attempt", req.body.answers[0].questionId);
    const result = await submitAttemptUseCase.execute({
  ...req.body,
  userId: req.user?.id
});
    if (!result) {
      throw new Error("Failed to submit attempt");
    }
    res.status(200).json({
      message: "Attempt submitted successfully",
      ...result,
    });
  } catch (err) {
    console.error("Submit quiz attempt failed", err);
    res.status(500).json({ error: "Failed to submit attempt" });
  }
}

static async getSubmissionStats(req: any , res : Response) {
  const { attemptId } = req.params;
  const userId = req.user?.id; // Assuming user ID is available in req.user
  try {
    const stats = await quizRepo.getSubmissionStats(attemptId, userId);
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch submission stats" });
  }
}

static async getQuizByTitle(req: Request, res: Response) {
  const { title } = req.params;
  // console.log("Fetching quizzes by title:", title);
  try {
    const quizzes = await getQuizByTitleUseCase.execute(title as string);
    res.status(200).json(quizzes);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch quizzes by title" });
  }
}

static async editRating(req: any, res: Response) {
  const { quizId } = req.params;
  const userId = req.user?.id; // Assuming user ID is available in req.user
  const { rating } = req.body;

  try {
    const updatedQuiz = await quizRepo.editRating(quizId, userId, rating);
    res.status(200).json(updatedQuiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to edit rating" });
  }
}
static async addComment(req: any, res: Response) {
  const { quizId } = req.params;
  const userId = req.user?.id; // Assuming user ID is available in req.user
  const { comment } = req.body;

  try {
    const updatedQuiz = await quizRepo.addComment(quizId, userId, comment);
    res.status(200).json(updatedQuiz);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to add comment" });
  }
}
 static async findByKeyAndValue(req: Request, res: Response) {
    const { key, value } = req.query;

    const allowedKeys = ['tag', 'title', 'creatorName'];

    // Safely cast to string if it's a valid value
    const searchKey = typeof key === 'string' ? key : '';
    const searchValue = typeof value === 'string' ? value : '';

    if (!searchKey || !searchValue) {
       return res.status(400).json({ message: 'Missing or invalid key/value' });
    }

    if (!allowedKeys.includes(searchKey)) {
       return res.status(403).json({ message: 'Invalid search key' });
    }

    try {

      const quizzes = await quizRepo.findByKeyAndValue(searchKey, searchValue);

      return res.status(200).json(quizzes);
    } catch (error) {
      console.error('FindByKeyAndValue error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}