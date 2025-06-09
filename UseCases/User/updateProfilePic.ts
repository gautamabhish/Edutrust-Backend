import { IUserRepository } from "../../IReps/IUserRepo";
export class updateProfilePic{
    constructor(private userRepo: IUserRepository) {}
    async execute(userId: string, imageUrl: string) {
        if (!userId || !imageUrl) {
            throw new Error("User ID and image URL are required");
        }
        return this.userRepo.updateProfilePic(userId, imageUrl);
    }
}