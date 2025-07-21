// src/Interfaces/Controllers/PaymentController.ts
import { Request, Response } from "express";
import { UserRepositoryImpl } from "../../InfraReps/UserImpl";
import { CreateOrderUseCase } from "../../UseCases/User/createOrder";
import { VerifyPaymentUseCase } from "../../UseCases/User/verifyPayment";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);
const useCase = new CreateOrderUseCase(userRepo)
export default class PaymentController {
  static async createOrder(req: Request, res: Response) {
    try {
      const { userId, quizId, referralToken } = req.body;
      if (!userId || !quizId) {
        return res
          .status(400)
          .json({ error: "userId and quizId are required" });
      }

      ;
      const result = await useCase.execute({ userId, quizId, referralToken });
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("CreateOrder error:", err);
      if(err.message.includes("This quiz is already purchased or attempted by the user."))
      {
        return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  }

  static async verifyPayment(req: any, res: Response) {
    try {
      const {
        userId,
        quizId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        referralToken,
      } = req.body;

      if (
        !userId ||
        !quizId ||
        !razorpayOrderId ||
        !razorpayPaymentId ||
        !razorpaySignature
      ) {
        return res
          .status(400)
          .json({ error: "Missing required payment verification parameters." });
      }

      const useCase = new VerifyPaymentUseCase(userRepo);
      const result = await useCase.execute({
        userId,
        quizId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        referralToken,
      });
      return res.status(200).json(result);
    } catch (err: any) {
      console.error("VerifyPayment error:", err);
      if(err.message.includes("This quiz is already purchased or attempted by the user.")) return res.status(409).json({ error: err.message });
      return res.status(400).json({ error: err.message });
    }
  }
}
