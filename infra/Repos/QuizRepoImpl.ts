// infra/repos/PrismaQuizRepository.ts

import { PrismaClient } from "@prisma/client";
import { IQuizRepo } from "../../domain/Repos/IQuizRepo";
import { Quiz } from "../../domain/entity/Quiz";

export class PrismaQuizRepository implements IQuizRepo {
  constructor(private prisma: PrismaClient) {}

  async create(quiz: Quiz): Promise<void> {
    await this.prisma.quiz.create({
      data: {
        title: quiz.title,
        description: quiz.description,
        creatorId: quiz.creatorId,
      },
    });
  }
}
