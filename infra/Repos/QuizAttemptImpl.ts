import { PrismaClient } from "../../generated/prisma";
import { IQuizAttemptRepo } from "../../domain/Repos/IQuizAttemptRepo";
import { QuizAttempt } from "../../domain/entity/QuizAttempt";
export class QuizAttemptRepositoryImpl implements IQuizAttemptRepo {
  constructor(private prisma: PrismaClient) {}

  async create(quizAttempt: QuizAttempt): Promise<void> {
    await this.prisma.quizAttempt.create({
      data: {
        id: quizAttempt.id,
        userId: quizAttempt.userId,
        quizId: quizAttempt.quizId,
        score: quizAttempt.score,
        startedAt: quizAttempt.startedAt,
        finishedAt: quizAttempt.finishedAt,
      },
    });
  }

  async update(quizAttempt: QuizAttempt): Promise<void> {
    await this.prisma.quizAttempt.update({
      where: { id: quizAttempt.id },
      data: {
        score: quizAttempt.score,
        finishedAt: quizAttempt.finishedAt,
      },
    });
  }

  async findById(id: string): Promise<QuizAttempt | null> {
    const result = await this.prisma.quizAttempt.findUnique({
      where: { id },
    });
    if (!result) return null;

    return new QuizAttempt(
      result.id,
      result.userId,
      result.quizId,
      result.score,
      result.startedAt,
      result.finishedAt
    );
  }

  async findByUserId(userId: string): Promise<QuizAttempt[]> {
    const results = await this.prisma.quizAttempt.findMany({
      where: { userId },
    });
    return results.map(
      (r) =>
        new QuizAttempt(
          r.id,
          r.userId,
          r.quizId,
          r.score,
          r.startedAt,
          r.finishedAt
        )
    );
  }
}
