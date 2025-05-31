// usecases/GetTrending.ts
import { IUserRepository } from "../../IReps/IUserRepo";
import { CourseDTO } from "../../IReps/IUserRepo";

export class GetTrending {
  constructor(private userRepo: IUserRepository) {}


  async execute(): Promise<{ courses: CourseDTO[] }> {
    const courses: CourseDTO[] = await this.userRepo.getExplore();
    return { courses };
  }
}
