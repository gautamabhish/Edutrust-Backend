import { Quiz } from "./Quiz";
import { Tag } from "./Tag";
export class Course {
  public id: string;
  public name: string;
  public url?: string;  // Optional as per Prisma
  public avgRating: number;

  public quizzes: Quiz[];
  public tags: Tag[];

  constructor(
    id: string,
    name: string,
    quizzes: Quiz[] = [],
    tags: Tag[] = [],
    avgRating: number = 0,
    url?: string
  ) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.avgRating = avgRating;
    this.quizzes = quizzes;
    this.tags = tags;
  }
}
