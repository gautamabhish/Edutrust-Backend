import { Quiz } from "./Quiz";
import { User } from "./User";

export class TestSeries {
  public id: string;
  public title: string;
  public description?: string;
  public createdAt: Date;
  public quizzes: Quiz[] = [];
  public users: User[] = [];

  constructor(
    id: string = crypto.randomUUID(),
    title: string,
    description?: string,
    createdAt: Date = new Date(),
    quizzes: Quiz[] = [],
    users: User[] = [],
  ) {
    if (!title || title.trim() === "") {
      throw new Error("Title cannot be empty");
    }
    this.id = id;
    this.title = title;
    this.description = description;
    this.createdAt = createdAt;
    this.quizzes = quizzes;
    this.users = users;
  }

  static create(title: string, description?: string): TestSeries {
    return new TestSeries(undefined, title, description);
  }

  addQuiz(quiz: Quiz): void {
    if (!this.quizzes.some(q => q.id === quiz.id)) {
      this.quizzes.push(quiz);
    }
  }

  removeQuiz(quizId: string): void {
    this.quizzes = this.quizzes.filter(q => q.id !== quizId);
  }

  addUser(user: User): void {
    if (!this.users.some(u => u.id === user.id)) {
      this.users.push(user);
    }
  }

  removeUser(userId: string): void {
    this.users = this.users.filter(u => u.id !== userId);
  }
}
