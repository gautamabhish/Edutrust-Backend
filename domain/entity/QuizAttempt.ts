export class QuizAttempt {
  constructor(
    public id: string,
    public userId: string,
    public quizId: string,
    public score: number | null,
    public startedAt: Date,
    public finishedAt: Date | null
  ) {}
}
