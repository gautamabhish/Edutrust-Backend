import { IQuizRepo } from "../../domain/Repos/IQuizRepo";
import { Difficulty, Quiz } from "../../domain/entity/Quiz";
import { v4 as uuid } from "uuid";

export class QuizUseCase {
  constructor(private quizRepo: IQuizRepo) {}

  // CREATE
  async createQuiz(input: {
    title: string;
    description: string;
    duration: number;
    difficulty: Difficulty;
    creatorId: string;
    courseId?: string;
    testSeriesId?: string;
    backtrack?: boolean;
    randomize?: boolean;
    visibleToPublic?: boolean;
    price?: number;
    currency?: string;
    thumbnailURL?: string;
  }) {
    const quiz = new Quiz(
      uuid(),
      uuid(),
      input.title,
      input.description,

      input.duration,
      input.backtrack ?? true,
      input.randomize ?? false,
      new Date(),
      input.visibleToPublic ?? false,
      input.difficulty,
      input.price ?? 0,
      0,
      input.courseId,
    //   input.creatorId,
      input.testSeriesId,
      input.currency ?? "inr",
      input.thumbnailURL ?? ""
    );

    await this.quizRepo.create(quiz);
    return { message: "Quiz created", id: quiz.id };
  }

  // UPDATE
  async updateQuiz(id: string, updates: Partial<Quiz>) {
    const existing = await this.quizRepo.findById(id);
    if (!existing) throw new Error("Quiz not found");

    const updated = { ...existing, ...updates };
    await this.quizRepo.update(updated);
    return { message: "Quiz updated" };
  }

  // DELETE
  async deleteQuiz(id: string) {
    await this.quizRepo.delete(id);
    return { message: "Quiz deleted" };
  }

  // GET BY ID
  async getQuizById(id: string) {
    const quiz = await this.quizRepo.findById(id);
    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }

  // GET BY TITLE
  async getQuizByTitle(title: string) {
    return await this.quizRepo.findByTitle(title);
  }

  // GET BY CREATOR
  async getQuizzesByCreator(creatorId: string) {
    return await this.quizRepo.findByCreatorId(creatorId);
  }

  // GET ALL
  async getAllQuizzes() {
    return await this.quizRepo.findAll();
  }

  // ADD QUESTION
  async addQuestion(quizId: string, questionId: string) {
    await this.quizRepo.addQuestion(quizId, questionId);
    return { message: "Question added to quiz" };
  }

  // REMOVE QUESTION
  async removeQuestion(quizId: string, questionId: string) {
    await this.quizRepo.removeQuestion(quizId, questionId);
    return { message: "Question removed from quiz" };
  }

//   // ADD TAG
//   async addTag(quizId: string, tagId: string) {
//     await this.quizRepo.a(quizId, tagId);
//     return { message: "Tag added to quiz" };
//   }

//   // REMOVE TAG
//   async removeTag(quizId: string, tagId: string) {
//     await this.quizRepo.removeTag(quizId, tagId);
//     return { message: "Tag removed from quiz" };
//   }
}
