export enum Difficulty {
  Easy,
  Medium,
  Hard
}
import { Course } from "./Course";
import { User } from "./User";
import { TestSeries } from "./TestSeries";
import { Question } from "./Question";
import { Referral } from "./Referal";
import { QuizRating } from "./QuizRating";
import { Tag } from "./Tag";
import { Certificate } from "./Certificate";
import { QuizAttempt } from "./QuizAttempt";


export class Quiz {
  public id: string;
  public courseId?: string | null;
  public creatorId: string;
  public testSeriesId?: string | null;
  public currency?: string | null;
  public title: string;
  public description: string;
  public thumbnailURL?: string | null;
  public duration: number;
  public backtrack: boolean;
  public randomize: boolean;
  public createdAt: Date;
  public visibleToPublic: boolean;
  public difficulty: Difficulty;
  public price: number;
  public avgRating: number;

  public course?: Course | null;
  public creator: User;
  public testSeries?: TestSeries | null;

  public questions: Question[];
  public referrals: Referral[];
  public quizRatings: QuizRating[];
  public tags: Tag[];

  public certificates: Certificate[];
  public quizAttempts: QuizAttempt[];

  constructor(
    id: string,
    creatorId: string,
    title: string,
    description: string,
    duration: number,
    backtrack: boolean,
    randomize: boolean,
    createdAt: Date,
    visibleToPublic: boolean,
    difficulty: Difficulty,
    price: number,
    avgRating: number,
    courseId?: string | null,
    testSeriesId?: string | null,
    currency?: string | null,
    thumbnailURL?: string | null,
    course?: Course | null,
    creator?: User,
    testSeries?: TestSeries | null,
    questions: Question[] = [],
    referrals: Referral[] = [],
    quizRatings: QuizRating[] = [],
    tags: Tag[] = [],
    certificates: Certificate[] = [],
    quizAttempts: QuizAttempt[] = [],
  ) {
    this.id = id;
    this.courseId = courseId ?? null;
    this.creatorId = creatorId;
    this.testSeriesId = testSeriesId ?? null;
    this.currency = currency ?? "inr";
    this.title = title;
    this.description = description;
    this.thumbnailURL = thumbnailURL ?? "";
    this.duration = duration;
    this.backtrack = backtrack;
    this.randomize = randomize;
    this.createdAt = createdAt;
    this.visibleToPublic = visibleToPublic;
    this.difficulty = difficulty;
    this.price = price;
    this.avgRating = avgRating;

    this.course = course ?? null;
    this.creator = creator!;
    this.testSeries = testSeries ?? null;

    this.questions = questions;
    this.referrals = referrals;
    this.quizRatings = quizRatings;
    this.tags = tags;

    this.certificates = certificates;
    this.quizAttempts = quizAttempts;
  }
}
