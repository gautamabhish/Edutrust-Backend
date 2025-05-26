
import { ITestSeriesRepo } from "../../domain/Repos/ITestSeriesRepo";
import { TestSeries } from "../../domain/entity/TestSeries";
import { Quiz } from "../../domain/entity/Quiz";
import { User } from "../../domain/entity/User";
export class TestSeriesUseCase {
  constructor(private testSeriesRepo: ITestSeriesRepo) {}

  async createTestSeries(title: string, description?: string): Promise<TestSeries> {
    const testSeries = TestSeries.create(title, description);
    await this.testSeriesRepo.create(testSeries);
    return testSeries;
  }

  async addQuizToTestSeries(testSeriesId: string, quiz: Quiz): Promise<void> {
    const testSeries = await this.testSeriesRepo.findById(testSeriesId);
    if (!testSeries) throw new Error("TestSeries not found");

    testSeries.addQuiz(quiz);
    await this.testSeriesRepo.update(testSeries);
  }

  async removeQuizFromTestSeries(testSeriesId: string, quizId: string): Promise<void> {
    const testSeries = await this.testSeriesRepo.findById(testSeriesId);
    if (!testSeries) throw new Error("TestSeries not found");

    testSeries.removeQuiz(quizId);
    await this.testSeriesRepo.update(testSeries);
  }

  async addUserToTestSeries(testSeriesId: string, user: User): Promise<void> {
    const testSeries = await this.testSeriesRepo.findById(testSeriesId);
    if (!testSeries) throw new Error("TestSeries not found");

    if (!testSeries.users.find(u => u.id === user.id)) {
      testSeries.users.push(user);
      await this.testSeriesRepo.update(testSeries);
    }
  }

  async removeUserFromTestSeries(testSeriesId: string, userId: string): Promise<void> {
    const testSeries = await this.testSeriesRepo.findById(testSeriesId);
    if (!testSeries) throw new Error("TestSeries not found");

    testSeries.users = testSeries.users.filter(u => u.id !== userId);
    await this.testSeriesRepo.update(testSeries);
  }
}
