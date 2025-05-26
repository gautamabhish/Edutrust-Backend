import { IQuestionRepo } from "../../domain/Repos/IQuestionRepo";
import { Question } from "../../domain/entity/Question";
export class QuestionUseCase {
  constructor(private repo: IQuestionRepo) {}

  async create(question: Question): Promise<void> {
    // Add any business validations here
    await this.repo.create(question);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async update(question: Question): Promise<void> {
    // Validate existence or business rules
    await this.repo.update(question);
  }

  async getById(id: string): Promise<Question | null> {
    return this.repo.findById(id);
  }

  async getByQuizId(quizId: string): Promise<Question[]> {
    return this.repo.findByQuizId(quizId);
  }
}
