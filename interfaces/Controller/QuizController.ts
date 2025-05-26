// interfaces/controllers/QuizController.ts

import { Request, Response } from "express";
import { QuizUseCase } from "../../application/Quiz/QuizUseCase";
import { QuizRepositoryImpl } from "../../infra/Repos/QuizRepoImpl";
import { PrismaClient } from "../../generated/prisma";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import express from "express";

const router = express.Router();
const prisma = new PrismaClient();
const quizRepo = new QuizRepositoryImpl(prisma);
const quizUseCase = new QuizUseCase(quizRepo);

export class QuizController {
  async create(req: AuthRequest, res: Response) {
    try {
      const {
        title,
        description,
        courseId,
        duration = 60,
        price = 0,
        currency = "inr",
        visibleToPublic = false,
        difficulty,
        allowBacktrack = true,
        randomize = false,
        tags = [],
        questions = [],
      } = req.body;

      const creatorId = req.user!.id;

      const quiz = await quizUseCase.createQuiz({
        title,
        description,
        duration,
        difficulty,
        creatorId,
        courseId,
        
        visibleToPublic,
        price,
        currency,
       
      });

      res.status(201).json({ message: "Quiz created successfully", quiz });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const quiz = await quizUseCase.getQuizById(id);
      res.json(quiz);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const quizzes = await quizUseCase.getAllQuizzes();
      res.json(quizzes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      await quizUseCase.updateQuiz(id, updates);
      res.json({ message: "Quiz updated successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await quizUseCase.deleteQuiz(id);
      res.json({ message: "Quiz deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async addQuestion(req: AuthRequest, res: Response) {
    try {
      const { quizId, questionId } = req.body;
      await quizUseCase.addQuestion(quizId, questionId);
      res.json({ message: "Question added to quiz" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async removeQuestion(req: AuthRequest, res: Response) {
    try {
      const { quizId, questionId } = req.body;
      await quizUseCase.removeQuestion(quizId, questionId);
      res.json({ message: "Question removed from quiz" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // async addTag(req: AuthRequest, res: Response) {
  //   try {
  //     const { quizId, tagId } = req.body;
  //     await quizUseCase.addTag(quizId, tagId);
  //     res.json({ message: "Tag added to quiz" });
  //   } catch (err: any) {
  //     res.status(500).json({ error: err.message });
  //   }
  // }

  // async removeTag(req: AuthRequest, res: Response) {
  //   try {
  //     const { quizId, tagId } = req.body;
  //     await quizUseCase.removeTag(quizId, tagId);
  //     res.json({ message: "Tag removed from quiz" });
  //   } catch (err: any) {
  //     res.status(500).json({ error: err.message });
  //   }
  // }
}

const quizController = new QuizController();

router.get("/getall", quizController.getAll.bind(quizController));
router.get("/:id", quizController.getById.bind(quizController));

router.post("/create", authMiddleware, quizController.create.bind(quizController));
router.put("/:id", authMiddleware, quizController.update.bind(quizController));
router.delete("/:id", authMiddleware, quizController.delete.bind(quizController));

router.post("/add-question", authMiddleware, quizController.addQuestion.bind(quizController));
router.post("/remove-question", authMiddleware, quizController.removeQuestion.bind(quizController));

// router.post("/addtag", authMiddleware, quizController.addTag.bind(quizController));
// router.post("/removetag", authMiddleware, quizController.removeTag.bind(quizController));

export { router as quizController };
