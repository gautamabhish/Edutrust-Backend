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
import { GetReferral } from "../../UseCases/User/getReferralUseCase";
const router = Router();
const prisma = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);

const registerUser = new RegisterUser(userRepo);
const loginUser = new LoginUser(userRepo);
const getTrending = new GetTrending(userRepo)
const getDashBoard = new GetUserDashboard(userRepo);
const getReferralId = new GetReferralIdUseCase(userRepo);
const getCertificateByIdCase = new getCertificateByIdUseCase(userRepo);
const getReferralusecase = new GetReferral(userRepo);
const getCreations = new GetReferral(userRepo);
const controller = new UserController(registerUser, loginUser, getDashBoard , getTrending , getReferralId,getCertificateByIdCase,getReferralusecase);
router.post("/register", async (req, res) => {await controller.register(req, res)});
router.post("/login", async(req, res) => {await controller.login(req, res)});
router.get("/certificate/:certificateId", async (req, res) => { await controller.getCertificateById(req, res) });
router.get("/dashboard/",(req , res , next)=>{authMiddleware(req,res,next)},async (req, res) => { await controller.getDashBoard(req, res)});
router.get("/explore",async (req, res) => {await controller.getTrending(req, res)});
router.get("/referral-link",(req , res , next)=>{authMiddleware(req,res,next)}, async (req, res) => { await controller.getReferralLink(req, res)});
router.get("getreferrals",(req , res , next)=>{authMiddleware(req,res,next)}, async (req, res) => { await controller.getReferrals(req, res)});
router.get("/get-creations", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.getCreations(req, res) });
export default router;
