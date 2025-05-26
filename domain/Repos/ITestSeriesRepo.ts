import { TestSeries } from '../entity/TestSeries';

export interface ITestSeriesRepo {
  create(testSeries: TestSeries): Promise<void>;
  findById(id: string): Promise<TestSeries | null>;
  addQuiz(testSeriesId: string, quizId: string): Promise<void>;
  removeQuiz(testSeriesId: string, quizId: string): Promise<void>;
  addUser(testSeriesId: string, userId: string): Promise<void>;
  removeUser(testSeriesId: string, userId: string): Promise<void>;
   update(testSeries: TestSeries): Promise<void>;
}
