import { PrismaClient } from "../../generated/prisma";
import { IQuestionRepo } from "../../domain/Repos/IQuestionRepo";
import { Question, QuestionType } from "../../domain/entity/Question";

export class QuestionRepositoryImpl implements IQuestionRepo {
  constructor(private prisma: PrismaClient) {}

  async create(question: Question): Promise<void> {
    await this.prisma.question.create({
      data: {
        id: question.id,
        quizId: question.quizId,
        type: question.type,
        text: question.text,
        points: question.points,
        options: question.options,
        correctAnswers: question.correctAnswers,
        answerText: question.answerText,
        attachFileType: question.attachFileType,
        attachFileURL: question.attachFileURL,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.question.delete({ where: { id } });
  }

  async update(question: Question): Promise<void> {
    await this.prisma.question.update({
      where: { id: question.id },
      data: {
        text: question.text,
        type: question.type,
        points: question.points,
        options: question.options,
        correctAnswers: question.correctAnswers,
        answerText: question.answerText,
        attachFileType: question.attachFileType,
        attachFileURL: question.attachFileURL,
      },
    });
  }

  async findById(id: string): Promise<Question | null> {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) return null;
    return new Question(
      q.id, q.quizId, q.type as QuestionType, q.text, q.points,
      q.options, q.correctAnswers, q.answerText, q.attachFileType, q.attachFileURL
    );
  }

  async findByQuizId(quizId: string): Promise<Question[]> {
    const questions = await this.prisma.question.findMany({ where: { quizId } });
    return questions.map(
      q => new Question(
        q.id, q.quizId, q.type as QuestionType, q.text, q.points,
        q.options, q.correctAnswers, q.answerText, q.attachFileType, q.attachFileURL
      )
    );
  }
}
