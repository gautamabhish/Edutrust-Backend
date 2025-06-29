import { IUserRepository } from "../../IReps/IUserRepo";
import { CertificateDTO, CourseDTO } from "../../IReps/IUserRepo";

export class GetReferral {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string): Promise<any> {
   const referrals = await this.userRepo.getReferrals(userId);
   return {
    referrals
  }
}
}
