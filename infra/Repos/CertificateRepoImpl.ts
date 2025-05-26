import { PrismaClient } from "../../generated/prisma";
import { ICertificateRepo } from "../../domain/Repos/ICertificateRepo";
import { Certificate } from "../../domain/entity/Certificate";
export class CertificateRepositoryImpl implements ICertificateRepo {
  constructor(private prisma: PrismaClient) {}

  async create(userId: string, quizId: string, score: number) {
    const certificate = await this.prisma.certificate.create({
      data: {
        userId,
        quizId,
        score,
      },
    });
    return certificate;
  }

  async update(certificate: Certificate) {
    const updatedCertificate = await this.prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        score: certificate.score,
        issuedAt: new Date(),
      },
    });
    return updatedCertificate;
  }

  async findById(id: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
    });
    return certificate;
  }
}    
