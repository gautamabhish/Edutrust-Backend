import { Router } from "express";
import { QuizController } from "../Controllers/QuizController";
import { authMiddleware } from "../../middlewares/authMidlleWare";
const router = Router();

router.post("/create",(req , res , next)=>{authMiddleware(req,res,next)} ,QuizController.create);
router.get("/fetch/:id",(req , res , next)=>{authMiddleware(req,res,next)}, QuizController.getById);
router.get("/fetch/paid/:id",(req , res , next)=>{authMiddleware(req,res,next)}, QuizController.getByIdPaid);
router.post("/submit",(req , res , next)=>{authMiddleware(req,res,next)}, QuizController.submitAttempt);
router.post("/fetch/:attemptId",(req , res , next)=>{authMiddleware(req,res,next)}, QuizController.getSubmissionStats);
router.get("/search/:title", QuizController.getQuizByTitle);

export default router;
