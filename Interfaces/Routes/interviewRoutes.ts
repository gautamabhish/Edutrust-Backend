import { Router } from "express";
import { InterviewController } from "../Controllers/InterviewController";
import { authMiddleware } from "../../middlewares/authMidlleWare";
import { PrismaClient } from "../../generated/prisma";
import { UserRepositoryImpl } from "../../InfraReps/UserImpl";
import { PurchaseTokensVerify, StartInterviewSession } from "../../UseCases/Interview/StartSession";
import { SubmitInterviewAnswer } from "../../UseCases/Interview/StartSession";
import { EndInterviewSession } from "../../UseCases/Interview/StartSession";
import { GetTokensLeft } from "../../UseCases/Interview/StartSession";
import { PurchaseTokens } from "../../UseCases/Interview/StartSession";
const router = Router();

const prisma   = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);

const startInterviewSession = new StartInterviewSession(userRepo);
const submitInterviewAnswer = new SubmitInterviewAnswer(userRepo);
const endInterviewSession = new EndInterviewSession(userRepo);
const purchaseTokens = new PurchaseTokens(userRepo);
const purchaseTokensVerify = new PurchaseTokensVerify(userRepo);
const getTokensLeft =  new GetTokensLeft(userRepo);
const controller = new InterviewController(
  startInterviewSession,
  submitInterviewAnswer,
  endInterviewSession,
  purchaseTokens,
  purchaseTokensVerify,
  getTokensLeft
);

router.post("/start", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.startSession(req, res) });
router.post("/submit-answer", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.submitAnswer(req, res) });
router.post("/end", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.endSession(req, res) });
router.post("/purchase", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.purchaseTokens(req, res) });
router.post("/purchase-verify", (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.purchaseTokensVerify(req, res) });
router.get('/token-left', (req, res, next) => { authMiddleware(req, res, next) }, async (req, res) => { await controller.getTokensLeft(req, res) });
export default router;