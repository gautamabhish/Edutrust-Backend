

import { Quiz } from "../entity/Quiz";

export interface IQuizRepo {
  create(quiz: Quiz): Promise<void>;
}
