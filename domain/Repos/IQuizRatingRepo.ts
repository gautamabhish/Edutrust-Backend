import { QuizRating } from "../entity/QuizRating";

export interface IQuizRatingRepo {
  rateQuiz(rating: QuizRating): Promise<void>;
  getAverageRating(quizId: string): Promise<number>;
  getRatingsByQuiz(quizId: string): Promise<QuizRating[]>;
}
