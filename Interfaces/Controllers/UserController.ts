// interface/controllers/UserController.ts
import { Request, Response } from "express";
import { RegisterUser } from "../../UseCases/User/Register";
import { LoginUser } from "../../UseCases/User/Login";
import { GetUserDashboard } from "../../UseCases/User/GetDashboard";
import { GetTrending } from "../../UseCases/User/getTrending";
import { GetReferralIdUseCase } from "../../UseCases/User/GetReferral";
import { getCertificateByIdUseCase } from "../../UseCases/User/GetCertificateById";
import { GetReferral } from "../../UseCases/User/getReferralUseCase";
import { updateProfilePic } from "../../UseCases/User/updateProfilePic";
import { getCreations } from "../../UseCases/User/GetCreation";
import { VerifyOTP } from "../../UseCases/User/VerifyOTP";
import { SetRedeemStatus } from "../../UseCases/User/SetReferralRedeemStatus";
import { GetProfileRequest } from "../../UseCases/User/getProfile";
import { SetQuizSettlementRequest } from "../../UseCases/User/SetQuizSettlement";
import { UpdateProfileRequest } from "../../UseCases/User/updateProfile";
import { sendProfileUpdateEmail } from "../../utils/mail-config-updateProfile";
import { ForgotPassword } from "../../UseCases/User/forgotPassword";
import { VerifyOTPandUpdatePass } from "../../UseCases/User/verifyOTPandUpdatePass";
export class UserController {
  constructor(
    private registerUser: RegisterUser,
    private loginUser: LoginUser,
    private dashboardUsecase: GetUserDashboard,
    private ExploreUsecase: GetTrending,
    private ReferralUseCase: GetReferralIdUseCase,
    private getCertificateByIdCase: getCertificateByIdUseCase,
    private getReferralUseCase: GetReferral,
    private updateProfilePicUsecase: updateProfilePic,
    private creationUseCase: getCreations,
    private VerifyOTP: VerifyOTP,
    private setStatusCheck: SetRedeemStatus,
    private setquizSettlementAndAmount: SetQuizSettlementRequest,
    private getProfile: GetProfileRequest,
    private updateProfile: UpdateProfileRequest,
    private forgotPassword: ForgotPassword,
    private verifyOTPAndUpdatePass: VerifyOTPandUpdatePass
  ) {}

  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const result = await this.registerUser.execute(name, email, password);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async setRedeemStatus(req: any, res: Response) {
    const userId = req.user?.id as string;
    const { referralId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const result = await this.setStatusCheck.execute(referralId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }


  async setQuizSettlement(req: any, res: Response) {
    const userId = req.user?.id as string;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const result = await this.setquizSettlementAndAmount.execute(userId);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
  async getTrending(req: Request, res: Response) {
    try {
      const trending = await this.ExploreUsecase.execute();
      return res.status(200).json(trending);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  async verifyOTP(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await this.VerifyOTP.execute(email, otp);

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const {user,token} = await this.loginUser.execute(email, password);
     
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    });
      return res.status(200).json( {user} );
    } catch (err:any) {
        return res.status(401).json({ error: err.message });
    }
  }
  async getDashBoard(req: any, res: Response) {
    try {
      const userId = req.user?.id as string;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await this.dashboardUsecase.execute(userId);

      res.json(result);
    } catch (err) {
      console.error("Dashboard error:", err);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  }

  async getReferralLink(req: any, res: Response) {
    const userId = req.user?.id as string;
    const quizId = req.query.quizId as string;


    const link = await this.ReferralUseCase.execute({
      quizId,
      userId,
    });

    return res.status(200).json({ referralLink: link });
  }

  async getCertificateById(req: Request, res: Response) {
    const { certificateId } = req.params;
    try {
      const certificateDetails = await this.getCertificateByIdCase.execute(
        certificateId
      );
      return res.status(200).json(certificateDetails);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }
  async getReferrals(req: any, res: Response) {
    const userId = req.user?.id as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const {referrals} = await this.getReferralUseCase.execute(userId);
      // console.log("Referrals fetched for user:", userId, referrals);
      return res.status(200).json({referrals});
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getCreations(req: any, res: Response) {
    const userId = req.user?.id as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      console.log("Fetching creations for user:", userId);
      const creations = await this.creationUseCase.execute(userId);
      return res.status(200).json(creations);
    } catch (err: any) {
      if(err.message === "User is not a creator") {
        return res.status(403).json({ error: "User is not a creator" });
      }
      return res.status(500).json({ error: err.message });
    }
  }
  async updateProfilePic(req: any, res: Response) {
    const userId = req.user?.id as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      console.log("Updating profile picture for user:", req.body);
      const { profilePicUrl } = req.body;
      console.log("Profile Pic URL:", profilePicUrl);
      // Assuming you have a method to update the user's profile picture
      await this.updateProfilePicUsecase.execute(userId, profilePicUrl);
      return res
        .status(200)
        .json({ message: "Profile picture updated successfully" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
async updateCreatorProfile(req: any, res: Response) {
  const userId = req.user?.id as string;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const {
      name,
      email,
      profilePic,
      phoneNumber,
      expertise,
      bio,
      experiencePoints,
      telegramLink,
      instagramLink,
      linkedinLink,
      portfolioLink,
    } = req.body;

    await this.updateProfile.execute(userId, {
      name,
      email,
      profilePic,
      phoneNumber,
      expertise,
      bio,
      experiencePoints,
      telegramLink,
      instagramLink,
      linkedinLink,
      portfolioLink,
    });
    await sendProfileUpdateEmail({  email  });
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

async getCreatorProfile(req: any, res: Response) {
    const userId = req.user?.id as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userProfile = await this.getProfile.execute(userId);
      if (!userProfile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      return res.status(200).json(userProfile);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

async forgotPass(req: Request, res: Response) {
    const { email } = req.body;
    try {
      const result = await this.forgotPassword.execute(email);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

async verifyOTPandUpdatePass(req: Request, res: Response) {
    const { email, otp, newPassword } = req.body;
    try {
      const result = await this.verifyOTPAndUpdatePass.execute(email, otp, newPassword);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
