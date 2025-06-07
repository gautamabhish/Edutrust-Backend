import { IUserRepository } from "../../IReps/IUserRepo";

export class getCertificateByIdUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(certificateId: string): Promise<
 any> {
    const certificateDetails = await this.userRepo.getCertificateById(certificateId);
    return {
     certificateDetails
    };
  }
}
