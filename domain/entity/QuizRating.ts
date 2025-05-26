import { User } from "./User";
import { Quiz } from "./Quiz";

export class QuizRating {
  public id: string;
  public user: User;
  public quiz: Quiz;
  public rating: number;
  public comment?: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    id: string,
    user: User,
    quiz: Quiz,
    rating: number,
    comment?: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this.id = id;
    this.user = user;
    this.quiz = quiz;
    this.rating = rating;
    this.comment = comment;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  updateRating(newRating: number, comment?: string): void {
    this.rating = newRating;
    this.comment = comment;
    this.updatedAt = new Date();
  }

  static create(user: User, quiz: Quiz, rating: number, comment?: string): QuizRating {
    return new QuizRating(crypto.randomUUID(), user, quiz, rating, comment);
  }
}
