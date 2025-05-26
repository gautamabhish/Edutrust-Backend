
import { Certificate } from "../../domain/entity/Certificate";
import { ICertificateRepo } from "../../domain/Repos/ICertificateRepo";
import { IUserRepository } from "../../domain/Repos/IUserRepo";

export class CertficateUseCase {
    constructor(
        private certificateRepo: ICertificateRepo,
        private userRepo: IUserRepository
    ) {}

    async createCertificate(userId: string, quizId: string, score: number) {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new Error("User not found");

        const certificate = await this.certificateRepo.create(userId, quizId, score);
        return certificate;
    }

 async updateCertificate(certificateId: string, newScore: number) {
    const certificate = await this.certificateRepo.findById(certificateId);
    if (!certificate) throw new Error("Certificate not found");

    certificate.score = newScore;
    certificate.issuedAt = new Date(); // Optional: re-issue time

    const updated = await this.certificateRepo.update(certificate);
    return updated;
}


}