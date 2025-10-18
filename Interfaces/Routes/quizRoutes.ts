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
router.put("/edit-rating/:quizId", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.editRating(req,res)});
router.get("/find-by", (req,res)=>{QuizController.findByKeyAndValue(req,res)});
router.get("/attempt-analysis/:quizId", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.attemptAnalysis(req,res)});
router.post("/create-learning-path", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.createLearningPath(req,res)});
router.get("/get-user-learning-paths", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.getUserLearningPaths(req,res)});
router.post("/add-resource-item/:pathId", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.addResourceItemToPath(req,res)});
router.get("/get-items-in-path/:pathId", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.getItemsInPath(req,res)});
router.delete("/remove-item/:itemId/:pathId", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.removeItemFromPath(req,res)});
router.put("/update-item-order/:itemId/:pathId", (req, res, next) => { authMiddleware(req, res, next) }, (req,res)=>{QuizController.updateItemOrderInPath(req,res)});
router.get('/getTop10-learningpath',(req,res)=>{QuizController.gettopLearingPath(req , res)})
export default router;
