// interfaces/controllers/quizController.ts

import { Request, Response } from "express";
import { CreateQuizUseCase } from "../../application/Quiz/Create";
import { PrismaQuizRepository } from "../../infra/Repos/QuizRepoImpl";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middlewares/authMiddleware";

const prisma = new PrismaClient();
const quizRepo = new PrismaQuizRepository(prisma);
const createQuizUseCase = new CreateQuizUseCase(quizRepo);

export const createQuizController = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, visibleToPublic, difficulty, courseId } = req.body;
    const creatorId = req.user!.id;

    await createQuizUseCase.execute({
      title,
      description,
      visibleToPublic,
      difficulty,
      creatorId,
      courseId,
    });

    res.status(201).json({ message: "Quiz created successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
