import { PrismaClient, Question, QuestionType } from "../generated/prisma";
import { IQuizRepository } from "../IReps/IQuizRepo";
import { CreateQuizInput } from "../entities/Quiz";
import { v4 as uuid  } from "uuid";

const prisma = new PrismaClient();

export class PrismaQuizRepo implements IQuizRepository {


  private  arraysEqual(a: number[], b: number[]) {
  return a.length === b.length && a.every(v => b.includes(v));
}
  private mapQuestionType(type: string): QuestionType {
    switch (type) {
      case "Single Correct":
        return QuestionType.SingleChoice;
      case "Multiple Correct":
        return QuestionType.MultipleChoice;
      default:
        throw new Error(`Unknown question type: ${type}`);
    } 
  }

  async createQuiz(data: CreateQuizInput): Promise<string> {
    return await prisma.$transaction(async (tx) => {
      const quizId = uuid();

      // Create or connect course if courseId is given
      let courseId = data.courseId ?? null;
      if (!courseId && data.courseURL) {
        const course = await tx.course.upsert({
          where: { url: data.courseURL },
          update: {},
          create: { id: uuid(), name: data.title, url: data.courseURL },
        });
        courseId = course.id;
      }

      // Create Quiz
      await tx.quiz.create({
        data: {
          id: quizId,
          title: data.title,
          description: data.description,
          duration: data.duration,
          difficulty: data.difficulty, 
          creatorId: data.creatorId,
          creatorName: data.creatorName,
          courseId,
          thumbnailURL: data.thumbURL ?? "",
          price: data.price,
          backtrack: data.backtrack,
          randomize: data.randomize,
          currency: data.currency ?? "inr",
        },
      });

      // Add Tags
      if (data.Tags && data.Tags.length) {
        for (const tag of data.Tags) {
          const tagRecord = await tx.tag.upsert({
            where: { name: tag },
            update: {},
            create: { id: uuid(), name: tag },
          });
          await tx.quiz.update({
            where: { id: quizId },
            data: {
              tags: {
                connect: { id: tagRecord.id },
              },
            },
          });
        }
      }

      // Add Questions
      for (const question of data.Questions) {
        await tx.question.create({
          data: {
            id: uuid(),
            quizId,
            type:this.mapQuestionType(question.type),
            text: question.text,
            points: question.points,
            negPoints: question.negPoints ?? 0,
            options: question.options,
            correctAnswers: question.correctAnswers,
            answerText: question.answerText,
            attachFileType: question.attachFileType,
            attachFileURL: question.attachFileURL,
          },
        });
      }

      return quizId;
    });
  }

    async findById(id: string): Promise<any> {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        course: { select: { id: true, name: true, url: true } },
        tags: { select: { name: true } },
        questions: true,
      },
    });

    if (!quiz) return null;

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      duration: quiz.duration,
      difficulty: quiz.difficulty,
      creator: quiz.creator,
      course: quiz.course,
      tags: quiz.tags.map(tag => tag.name),
      questions: quiz.questions.map(q => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        options: q.options,
        correctAnswers: q.correctAnswers,
        answerText: q.answerText,
        attachFileType: q.attachFileType,
        attachFileURL: q.attachFileURL,
      })),
      price: quiz.price,
      currency: quiz.currency,
      backtrack: quiz.backtrack,
      randomize: quiz.randomize,
      thumbnailURL: quiz.thumbnailURL,
      createdAt: quiz.createdAt,
    };
  }

  async submitAttempt(data: {
  userId: string;
  quizId: string;
  answers: {
    questionId: string;
    selectedOptions?: number[];
    answerText?: string;
  }[];
  startedAt: Date;
  finishedAt?: Date;
}): Promise<{ score: number; certificateIssued: boolean }> {
  return await prisma.$transaction(async (tx) => {
    const questions = await tx.question.findMany({
      where: { quizId: data.quizId }
    });

    let score = 0;

    for (const answer of data.answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      if (
        question.type === "SingleChoice" ||
        question.type === "MultipleChoice"
      ) {
        const correct = question.correctAnswers as number[];
  const selected = answer.selectedOptions as number[];

  const isCorrect =
    question.type === 'MultipleChoice' || question.type === 'SingleChoice'
      ? this.arraysEqual(correct.sort(), selected.sort())
      : true;

  if (isCorrect) {
    score += question.points;
  }
      }

      if (question.type === "Subjective" || question.type === "File") {
        // You might want to skip or store for manual evaluation
      }
    }

    // Create QuizAttempt
    const attempt = await tx.quizAttempt.create({
      data: {
        userId: data.userId,
        quizId: data.quizId,
        score,
        startedAt: data.startedAt,
        finishedAt: data.finishedAt ?? new Date(),
      },
    });

    // Issue certificate (optional rule: score >= 40% of total)
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    let certificateIssued = false;

    if (score >= totalPoints * 0.4) {
      await tx.certificate.create({
        data: {
          userId: data.userId,
          quizId: data.quizId,
          score,
        },
      });
      certificateIssued = true;
    }

    return { score, certificateIssued };
  });
}

}
