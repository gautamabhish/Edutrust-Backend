import { IUserRepository } from "../../IReps/IUserRepo";

type GetProfileResponse = {
  id: string;
  name: string;
  email: string;
  profilePic: string;
  creatorVerified: boolean;
  creatorProfile?: {
    phoneNumber: string;
    expertise: string;
    bio: string;
    experiencePoints: string[];
    telegramLink?: string;
    instagramLink?: string;
    linkedinLink?: string;
    portfolioLink?: string;
    status: string;
  };
};

export class GetProfileRequest {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string): Promise<GetProfileResponse> {
    if (!userId) throw new Error("Invalid user ID.");

    const user = await this.userRepo.findByIdWithCreatorProfile(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    return {
      id: user.id,
      name: user.name || "User",
      email: user.email,
      profilePic: user.profilePic || "/user.jpg",
      creatorVerified: user.creatorVerified,
      creatorProfile: user.creatorProfile, // undefined if not available
    };
  }
}
