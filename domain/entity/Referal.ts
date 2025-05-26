import { User } from "./User";
import { Quiz } from "./Quiz";

export class Referral {
  constructor(
    public id: string,
    public referrerId: string,
    public referredUserId: string | null,
    public quizId: string,
    public earnedAmount: number,
    public createdAt: Date,
    public referrer?: User,
    public referredUser?: User | null,
    public quiz?: Quiz
  ) {}
}
