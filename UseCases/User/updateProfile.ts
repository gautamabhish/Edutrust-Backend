import { IUserRepository } from "../../IReps/IUserRepo";

interface UpdateProfileData {
  name?: string;
  email?: string;
  profilePic?: string | null;
  phoneNumber?: string;
  expertise?: string;
  bio?: string;
  experiencePoints?: string[];
  telegramLink?: string;
  instagramLink?: string;
  linkedinLink?: string;
  portfolioLink?: string;
}

export class UpdateProfileRequest {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string, profileData: UpdateProfileData): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const sanitizedData: UpdateProfileData = {
      name: profileData.name?.trim(),
      email: profileData.email?.trim(),
      profilePic: profileData.profilePic ?? null,
      phoneNumber: profileData.phoneNumber?.trim(),
      expertise: profileData.expertise?.trim(),
      bio: profileData.bio?.trim(),
      experiencePoints: profileData.experiencePoints?.map((pt) => pt?.trim()).filter(Boolean),
      telegramLink: profileData.telegramLink?.trim(),
      instagramLink: profileData.instagramLink?.trim(),
      linkedinLink: profileData.linkedinLink?.trim(),
      portfolioLink: profileData.portfolioLink?.trim(),
    };
    
    
    // Delegate update to repository
    await this.userRepo.updateProfile(userId, sanitizedData);
    
  }
}
