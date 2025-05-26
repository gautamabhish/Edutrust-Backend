import { PrismaClient, Prisma_Difficulty } from "../../generated/prisma";
import { IQuizRepo } from "../../domain/Repos/IQuizRepo";
import { Difficulty, Quiz } from "../../domain/entity/Quiz";
import { v4 as uuid4 } from "uuid";
export class QuizRepositoryImpl implements IQuizRepo {
  constructor(private prisma: PrismaClient) {}

  private mapDifficulty(difficulty: Difficulty): Prisma_Difficulty {
    switch (difficulty) {
      case Difficulty.Easy:
        return Prisma_Difficulty.Easy;
      case Difficulty.Medium:
        return Prisma_Difficulty.Medium;
      case Difficulty.Hard:
        return Prisma_Difficulty.Hard;
      default:
        return Prisma_Difficulty.Medium;
    }
  }

  private mapDifficultyPrisma(difficulty: Prisma_Difficulty): Difficulty {
    switch (difficulty) {
      case Prisma_Difficulty.Easy:
        return Difficulty.Easy;
      case Prisma_Difficulty.Medium:
        return Difficulty.Medium;
      case Prisma_Difficulty.Hard:
        return Difficulty.Hard;
      default:
        return Difficulty.Medium;
    }
  }

  async create(quiz: Quiz): Promise<void> {
    await this.prisma.quiz.create({
      data: {
        id: quiz.id,
        courseId: quiz.courseId,
        creatorId: quiz.creatorId,
        testSeriesId: quiz.testSeriesId,
        currency: quiz.currency,
        title: quiz.title,
        description: quiz.description,
        thumbnailURL: quiz.thumbnailURL,
        duration: quiz.duration,
        backtrack: quiz.backtrack,
        randomize: quiz.randomize,
        createdAt: quiz.createdAt,
        visibleToPublic: quiz.visibleToPublic,
        difficulty: this.mapDifficulty(quiz.difficulty),
        price: quiz.price,
        avgRating: quiz.avgRating,
      },
    });
  }

  async update(quiz: Quiz): Promise<void> {
    await this.prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        title: quiz.title,
        description: quiz.description,
        thumbnailURL: quiz.thumbnailURL,
        duration: quiz.duration,
        backtrack: quiz.backtrack,
        randomize: quiz.randomize,
        visibleToPublic: quiz.visibleToPublic,
        difficulty: this.mapDifficulty(quiz.difficulty),
        price: quiz.price,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.quiz.delete({ where: { id } });
  }

  async findById(id: string): Promise<Quiz | null> {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) return null;

    return new Quiz(
      quiz.id,
      uuid4(),
      quiz.title,
      quiz.description,
      quiz.duration,
      quiz.backtrack,
      quiz.randomize,
      quiz.createdAt,
      quiz.visibleToPublic,
      this.mapDifficultyPrisma(quiz.difficulty),
      quiz.price,
      quiz.avgRating,
      quiz.courseId,
      quiz.testSeriesId,
      quiz.currency,
      quiz.thumbnailURL || ""
    );
  }

  async findByTitle(title: string): Promise<Quiz[]> {
    const quizzes = await this.prisma.quiz.findMany({
      where: { title: { contains: title } },
    });
    return quizzes.map(q => this.toEntity(q));
  }

  async findByCourseId(courseId: string): Promise<Quiz[]> {
    const quizzes = await this.prisma.quiz.findMany({ where: { courseId } });
    return quizzes.map(q => this.toEntity(q));
  }

  async findByCreatorId(creatorId: string): Promise<Quiz[]> {
    const quizzes = await this.prisma.quiz.findMany({ where: { creatorId } });
    return quizzes.map(q => this.toEntity(q));
  }

  async findAll(): Promise<Quiz[]> {
    const quizzes = await this.prisma.quiz.findMany();
    return quizzes.map(q => this.toEntity(q));
  }

  async addQuestion(quizId: string, questionId: string): Promise<void> {
    await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: {
          connect: { id: questionId },
        },
      },
    });
  }

  async removeQuestion(quizId: string, questionId: string): Promise<void> {
    await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: {
          disconnect: { id: questionId },
        },
      },
    });
  }

  private toEntity(q: any): Quiz {
    return new Quiz(
      q.id,
      q.title,
      q.description,
      q.duration,
      q.backtrack,
      q.randomize,
      q.createdAt,
      q.visibleToPublic,
      q.difficulty,
      q.price,
      q.avgRating,
      q.courseId,
      q.creatorId,
      q.testSeriesId,
      q.currency,
      q.thumbnailURL || ""
    );
  }
}
