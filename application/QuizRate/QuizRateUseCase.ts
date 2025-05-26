


import { QuizRating } from "../../domain/entity/QuizRating";
import { IQuizRatingRepo } from "../../domain/Repos/IQuizRatingRepo";
import {User} from "../../domain/entity/User";
import {Quiz} from "../../domain/entity/Quiz";
export class QuizRatingUseCase {
  constructor(private ratingRepo: IQuizRatingRepo) {}

  async rateQuiz(user: User, quiz: Quiz, rating: number, comment?: string): Promise<QuizRating> {
    const quizRating = QuizRating.create(user, quiz, rating, comment);
    await this.ratingRepo.save(quizRating);
    return quizRating;
  }

  async updateRating(ratingId: string, newRating: number, comment?: string): Promise<void> {
    const quizRating = await this.ratingRepo.findById(ratingId);
    if (!quizRating) throw new Error("Rating not found");

    quizRating.updateRating(newRating, comment);
    await this.ratingRepo.update(quizRating);
  }
}
