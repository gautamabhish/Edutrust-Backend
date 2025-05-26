import { PrismaClient } from "../../generated/prisma";
import { ICourseRepo } from "../../domain/Repos/ICourseRepo";
import { Course } from "../../domain/entity/Course";
import { Quiz } from "../../domain/entity/Quiz";
import { Tag } from "../../domain/entity/Tag";

export class CourseRepositoryImpl implements ICourseRepo {
  constructor(private prisma: PrismaClient) {}

  async create(course: Course): Promise<void> {
    await this.prisma.course.create({
      data: {
        id: course.id,
        name: course.name,
        url: course.url,
        quizzes: {
          connect: course.quizzes.map((q) => ({ id: q.id })),
        },
        tags: {
          connect: course.Tags.map((t) => ({ id: t.id })),
        },
      },
    });
  }

  async findByUrl(url: string): Promise<Course | null> {
    const result = await this.prisma.course.findUnique({
      where: { url },
      include: {
        quizzes: true,
        tags: true,
      },
    });

    if (!result) return null;

    return new Course(
      result.id,
      result.name,
      result.url ?? "",
      result.quizzes as Quiz[],
      result.tags as Tag[]
    );
  }

  async addQuiz(courseId: string, quizId: string): Promise<void> {
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        quizzes: {
          connect: { id: quizId },
        },
      },
    });
  }

  async removeQuiz(courseId: string, quizId: string): Promise<void> {
    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        quizzes: {
          disconnect: { id: quizId },
        },
      },
    });
  }

  async findAll(): Promise<Course[]> {
    const results = await this.prisma.course.findMany({
      include: {
        quizzes: true,
        tags: true,
      },
    });

    return results.map(
      (c) =>
        new Course(
          c.id,
          c.name,
          c.url ?? "",
          c.quizzes as Quiz[],
          c.tags as Tag[]
        )
    );
  }
}
