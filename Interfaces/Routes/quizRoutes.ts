import { Router } from "express";
import { QuizController } from "../Controllers/QuizController";
import { authMiddleware } from "../../middlewares/authMidlleWare";
const router = Router();

router.post("/create",(req , res , next)=>{authMiddleware(req,res,next)} ,(req,res)=>{QuizController.create(req,res)});
router.get("/fetch/:id", QuizController.getById);
router.get("/fetch/paid/:id",(req , res , next)=>{authMiddleware(req,res,next)},(req,res)=>{ QuizController.getByIdPaid(req,res)});
router.post("/submit",(req , res , next)=>{authMiddleware(req,res,next)}, QuizController.submitAttempt);
router.post("/fetch/:attemptId",(req , res , next)=>{authMiddleware(req,res,next)}, QuizController.getSubmissionStats);
router.post("/add-comment/:quizId", (req, res, next) => { authMiddleware(req, res, next) }, QuizController.addComment);
router.get("/search/:title", QuizController.getQuizByTitle);
router.put("/edit-rating/:quizId", (req, res, next) => { authMiddleware(req, res, next) }, QuizController.editRating);
router.get("/find-by", (req,res)=>{QuizController.findByKeyAndValue(req,res)});

export default router;
