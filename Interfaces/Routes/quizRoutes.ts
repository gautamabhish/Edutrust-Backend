import { Router } from "express";
import { QuizController } from "../Controllers/QuizController";

const router = Router();

router.post("/create", QuizController.create);
router.get("/fetch/:id", QuizController.getById);
router.post("/submit", QuizController.submitAttempt);
export default router;
