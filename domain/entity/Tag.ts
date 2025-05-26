import { Quiz } from "./Quiz";
import { Course } from "./Course";

export class Tag {
  public id: string;
  public name: string;

  public quizzes: Quiz[];
  public courses: Course[];

  constructor(
    id: string,
    name: string,
    quizzes: Quiz[] = [],
    courses: Course[] = []
  ) {
    this.id = id;
    this.name = name;
    this.quizzes = quizzes;
    this.courses = courses;
  }
}
