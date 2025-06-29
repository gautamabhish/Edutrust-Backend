// interface/routes/userRoutes.ts
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { UserRepositoryImpl } from "../../InfraReps/UserImpl";
import { LoginUser } from "../../UseCases/User/Login";
import { RegisterUser } from "../../UseCases/User/Register";
import { UserController } from "../../Interfaces/Controllers/UserController";
import { GetUserDashboard } from "../../UseCases/User/GetDashboard";
import { GetTrending } from "../../UseCases/User/getTrending";
import { authMiddleware } from "../../middlewares/authMidlleWare";
import { GetReferralIdUseCase } from "../../UseCases/User/GetReferral";
import { getCertificateByIdUseCase } from "../../UseCases/User/GetCertificateById";
import {v2 as cloudinary} from "cloudinary";
import { getCreations } from "../../UseCases/User/GetCreation";
import { GetReferral } from "../../UseCases/User/getReferralUseCase";
import { updateProfilePic } from "../../UseCases/User/updateProfilePic";
import { VerifyOTP } from "../../UseCases/User/VerifyOTP";
import { SetRedeemStatus } from "../../UseCases/User/SetReferralRedeemStatus";
import { SetQuizSettlementRequest } from "../../UseCases/User/SetQuizSettlement";
const router = Router();
const prisma = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
    });
const registerUser = new RegisterUser(userRepo);
const loginUser = new LoginUser(userRepo);
const setRedeemStatus = new SetRedeemStatus(userRepo);
const getTrending = new GetTrending(userRepo)
const getDashBoard = new GetUserDashboard(userRepo);
const getReferralId = new GetReferralIdUseCase(userRepo);
const getCertificateByIdCase = new getCertificateByIdUseCase(userRepo);
const getReferralusecase = new GetReferral(userRepo);
const updateProfilePicUsecase = new updateProfilePic(userRepo);
const Creations = new getCreations(userRepo);
const setQuizSettlement = new SetQuizSettlementRequest(userRepo);
const verifyOTP = new VerifyOTP(userRepo);
const controller = new UserController(registerUser, loginUser, getDashBoard , getTrending , getReferralId,getCertificateByIdCase,getReferralusecase,updateProfilePicUsecase,Creations,verifyOTP ,setRedeemStatus ,setQuizSettlement);
router.post("/register", async (req, res) => {await controller.register(req, res)});
router.post("/login", async(req, res) => {await controller.login(req, res)});
// router.get("/session/start", async (req, res) => { await  });
router.post("/QuizSettlementRequested", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.setQuizSettlement(req, res) });
router.post("/verify-otp", async(req, res) => {await controller.verifyOTP(req, res)});
router.get("/certificate/:certificateId", async (req, res) => { await controller.getCertificateById(req, res) });
router.get("/dashboard/",(req , res , next)=>{authMiddleware(req,res,next)},async (req, res) => { await controller.getDashBoard(req, res)});
router.get("/explore",async (req, res) => {await controller.getTrending(req, res)});
router.get("/referral-link",(req , res , next)=>{authMiddleware(req,res,next)}, async (req, res) => { await controller.getReferralLink(req, res)});
router.get("/getreferrals",(req , res , next)=>{authMiddleware(req,res,next)}, async (req, res) => { await controller.getReferrals(req, res)});
router.get("/get-creations", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.getCreations(req, res) });
router.put("/update-profile-pic", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.updateProfilePic(req, res) });
router.put("/redeemStatusCheck", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => {await controller.setRedeemStatus(req, res) });
router.post("/signature", async (req, res, next) => {authMiddleware(req, res, next)}, async (req, res) => { 
    const { public_id, folder } = req.body;

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    timestamp,
    public_id,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    cloudinary.config().api_secret??"error" 
  );
  console.log(signature)
  res.json({
    timestamp,
    signature,
    apiKey: cloudinary.config().api_key,
    cloudName: cloudinary.config().cloud_name,
  });});
export default router;
