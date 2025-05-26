import { Certificate } from "../entity/Certificate";


export interface ICertificateRepo {
    create(userId: string, quizId: string, score: number): Promise<Certificate>;
    
    update(certificate:Certificate): Promise<Certificate>;

    findById(id: string): Promise<Certificate | null>

}