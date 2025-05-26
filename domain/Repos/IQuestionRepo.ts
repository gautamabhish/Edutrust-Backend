import { Question } from "../entity/Question";
export interface IQuestionRepo {
  create(question: Question): Promise<void>;
  delete(id: string): Promise<void>;
  update(question: Question): Promise<void>;
  findById(id: string): Promise<Question | null>;
  findByQuizId(quizId: string): Promise<Question[]>;
}
