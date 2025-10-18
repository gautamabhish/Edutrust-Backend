import { CreateQuizInput } from "../entities/Quiz";
import { Prisma } from "../generated/prisma";
import { CourseDTO } from "./IUserRepo";
export type ResourceItemInput =
  | { type: 'QUIZ'; quizId: string }
  | { type: 'ARTICLE' | 'VIDEO' | 'LINK'; resourceTitle: string; resourceUrl: string };

export interface IQuizRepository {
  createQuiz(data: CreateQuizInput): Promise<string>; // returns Quiz ID
  
findById(quizId: string): Promise<any>; // returns Quiz data or null if not found

submitAttempt(data: {
  userId: string;
  quizId: string;
  answers: {
    questionId: string;
    selectedOptions?: number[];
    answerText?: string;
  }[];
  startedAt: Date;
  finishedAt?: Date;
}): Promise<any>;

editRating(quizId: string, userId: string, rating: number): Promise<any>; // returns Quiz data or null if not found
findByIdPaid(quizId: string , userId:string): Promise<any>; // returns Quiz data or null if not found
getSubmissionStats(attemptId: string ,userId : string,tx?:Prisma.TransactionClient): Promise<any>;
findByKeyAndValue(key: string,value:string): Promise<any[]>; // returns Quiz data or null if not found
getQuizByTitle(quizTitle:string): Promise<CourseDTO[]>; // returns Quiz data or null if not found
addComment(quizId: string, userId: string, comment: string): Promise<any>; // returns Quiz data or null if not found
AttemptAnalysis(quizId: string, userId: string, tx?: Prisma.TransactionClient): Promise<any>; // returns Quiz data or null if not found
 addResourceItemToPath(
    pathId: string,
    order: number,
    input: ResourceItemInput
  ): Promise<void>;
  getItemsInPath(pathId: string): Promise<any[]>;

  removeItemFromPath(itemId: string, pathId: string): Promise<void>;

  updateItemOrderInPath(itemId: string, pathId: string, newOrder: number): Promise<void>;

  getUserLearningPaths(userId: string): Promise<any[]>;
 createLearningPath(
  title: string,
  description?: string
): Promise<string> ;

getLearningPathById(pathId: string): Promise<any>;
getLeaningPathByTitle(title: string): Promise<any>;
getPathsInfiniteScroll(
  cursor?: string |null,
  take?: number
): Promise<{ paths: any[]; nextCursor: string | null }>;
}
