import { Quiz } from "../entity/Quiz";

export interface IQuizRepo {
  create(quiz: Quiz): Promise<void>;
  update(quiz: Quiz): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Quiz | null>;
  findByTitle(title: string): Promise<Quiz[]>;
  findByCourseId(courseId: string): Promise<Quiz[]>;
  findByCreatorId(creatorId: string): Promise<Quiz[]>;
  findAll(): Promise<Quiz[]>;
  addQuestion(quizId: string, questionId: string): Promise<void>;
  removeQuestion(quizId: string, questionId: string): Promise<void>;
}
