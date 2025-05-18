// app/use-cases/CreateQuiz.ts

import { IQuizRepo } from "../../domain/Repos/IQuizRepo";
import { Quiz } from "../../domain/entity/Quiz";

import { difficulty } from "../../domain/entity/Quiz";
interface CreateQuizDTO {
  title: string;
  description: string;
  visibleToPublic: boolean;
  difficulty:difficulty  ;
  creatorId: string;
  courseId?: string;
}

export class CreateQuizUseCase {
  constructor(private quizRepo: IQuizRepo) {}

  async execute(data: CreateQuizDTO): Promise<void> {
    const quiz = new Quiz(
      data.title,
      data.creatorId,
      data.description,
      data.visibleToPublic,
      data.difficulty = difficulty.Medium,
      data.courseId
    );

    await this.quizRepo.create(quiz);
  }
}
