import { IQuizRepository } from "../../IReps/IQuizRepo";
import { QuizEntity } from "../../entities/Quiz";

export class CreateQuiz {
  constructor(private readonly quizRepo: IQuizRepository) {}

  async execute(input: QuizEntity) {
    return this.quizRepo.createQuiz(input.data);
  }
}
