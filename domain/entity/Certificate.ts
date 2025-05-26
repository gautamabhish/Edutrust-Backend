export class Certificate {
    public id: string;
    public userId: string;
    public quizId: string;
    public issuedAt: Date;
    public score: number;

    constructor(
        id: string,
        userId: string,
        quizId: string,
        issuedAt: Date,
        score: number
    ) {
        this.id = id;
        this.userId = userId;
        this.quizId = quizId;
        this.issuedAt = issuedAt;
        this.score = score;
    }
}
