// interface/controllers/UserController.ts
import { Request, Response } from "express";
import { RegisterUser } from "../../UseCases/User/Register";
import { LoginUser } from "../../UseCases/User/Login";
import { GetUserDashboard } from "../../UseCases/User/GetDashboard";
import { GetTrending } from "../../UseCases/User/getTrending";
import { GetReferralIdUseCase } from "../../UseCases/User/GetReferral";
import { getCertificateByIdUseCase } from "../../UseCases/User/GetCertificateById";
import { GetReferral } from "../../UseCases/User/getReferralUseCase";
export class UserController {
  constructor(
    private registerUser: RegisterUser,
    private loginUser: LoginUser,
    private dashboardUsecase: GetUserDashboard , 
    private ExploreUsecase: GetTrending,
    private ReferralUseCase: GetReferralIdUseCase,
    private getCertificateByIdCase: getCertificateByIdUseCase,
    private getReferralUseCase: GetReferral
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

  async getTrending(req: Request, res: Response) {
    try {
      const trending = await this.ExploreUsecase.execute();
      return res.status(200).json(trending);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const {user,token} = await this.loginUser.execute(email, password);
     
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "strict",
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
};

  async getReferralLink(req: Request, res: Response) {
     const {userId ,quizId } = req.body;



  const link = await this.ReferralUseCase.execute({
    quizId,
    userId,
  });

  return res.status(200).json({ referralLink: link });
  }


  async getCertificateById(req: Request, res: Response) {
    const { certificateId } = req.params;
    try {
      const certificateDetails = await this.getCertificateByIdCase.execute(certificateId);
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
      const referrals = await this.getReferralUseCase.execute(userId);
      return res.status(200).json(referrals);
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
      const creations = await this.getReferralUseCase.execute(userId);
      return res.status(200).json(creations);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
