import { PrismaClient } from "../../generated/prisma";
import { ITestSeriesRepo } from "../../domain/Repos/ITestSeriesRepo";
import { TestSeries } from "../../domain/entity/TestSeries";

export class TestSeriesRepositoryImpl implements ITestSeriesRepo {
  constructor(private prisma: PrismaClient) {}

  async create(testSeries: TestSeries): Promise<void> {
    await this.prisma.testSeries.create({
      data: {
        id: testSeries.id,
        title: testSeries.title,
        description: testSeries.description,
        createdAt: testSeries.createdAt,
      },
    });
  }

  async findById(id: string): Promise<TestSeries | null> {
    const result = await this.prisma.testSeries.findUnique({
      where: { id },
      include: {
        quizzes: true,
        users: true,
      },
    });

    if (!result) return null;

    // Map Prisma result to your TestSeries entity
    return new TestSeries(
      result.id,
      result.title,
      result.description ?? undefined,
      result.createdAt,
      result.quizzes, // Make sure quizzes are compatible with Quiz[]
      result.users // Make sure users are compatible with User[]
    );
  }

  async update(testSeries: TestSeries): Promise<void> {
    await this.prisma.testSeries.update({
      where: { id: testSeries.id },
      data: {
        title: testSeries.title,
        description: testSeries.description,
        // Note: For quizzes and users relations, update them using separate methods below
      },
    });
  }

  async addQuiz(testSeriesId: string, quizId: string): Promise<void> {
    await this.prisma.testSeries.update({
      where: { id: testSeriesId },
      data: {
        quizzes: {
          connect: { id: quizId },
        },
      },
    });
  }

  async removeQuiz(testSeriesId: string, quizId: string): Promise<void> {
    await this.prisma.testSeries.update({
      where: { id: testSeriesId },
      data: {
        quizzes: {
          disconnect: { id: quizId },
        },
      },
    });
  }

  async addUser(testSeriesId: string, userId: string): Promise<void> {
    await this.prisma.testSeries.update({
      where: { id: testSeriesId },
      data: {
        users: {
          connect: { id: userId },
        },
      },
    });
  }

  async removeUser(testSeriesId: string, userId: string): Promise<void> {
    await this.prisma.testSeries.update({
      where: { id: testSeriesId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
    });
  }
}
