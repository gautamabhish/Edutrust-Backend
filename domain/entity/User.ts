import { TestSeries } from "./TestSeries";
import { Quiz } from "./Quiz";
import { Referral } from "./Referal";
import { QuizRating } from "./QuizRating";
import { Certificate } from "./Certificate";
import { QuizAttempt } from "./QuizAttempt";

export enum Role {
  Default = "Default",
  Admin = "Admin",
  SuperAdmin = "SuperAdmin",
}


export class User {
  public id: string;
  public name: string;
  public email: string;
  private password: string;
  public createdAt: Date;
  public role: Role;

  public testSeries?: TestSeries[];
  public quizzesCreated?: Quiz[];
  public referralsMade?: Referral[];
  public referredAs?: Referral[];
  public quizRatings?: QuizRating[];
  public certificates?: Certificate[];
  public quizAttempts?: QuizAttempt[];

  constructor(
    id: string,
    name: string,
    email: string,
    password: string,
    createdAt: Date,
    role: Role = Role.Default,
    testSeries: TestSeries[] = [],
    quizzesCreated: Quiz[] = [],
    referralsMade: Referral[] = [],
    referredAs: Referral[] = [],
    quizRatings: QuizRating[] = [],
    certificates: Certificate[] = [],
    quizAttempts: QuizAttempt[] = [],
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.createdAt = createdAt;
    this.role = role;

    this.testSeries = testSeries;
    this.quizzesCreated = quizzesCreated;
    this.referralsMade = referralsMade;
    this.referredAs = referredAs;
    this.quizRatings = quizRatings;
    this.certificates = certificates;
    this.quizAttempts = quizAttempts;
  }

  getPassword(): string {
    return this.password;
  }

  // Add business logic methods as needed
}
