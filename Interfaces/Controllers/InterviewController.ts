import { Request, Response } from "express";
import { StartInterviewSession,SubmitInterviewAnswer,EndInterviewSession, PurchaseTokens, PurchaseTokensVerify, GetTokensLeft } from "../../UseCases/Interview/StartSession";
import { GeminiUtility } from "../../utils/geminiUtility";

export class InterviewController {
  constructor(
    private startSessionUseCase: StartInterviewSession,
    private submitAnswerUseCase: SubmitInterviewAnswer,
    private endSessionUseCase: EndInterviewSession,
    private purchaseTokensUseCase: PurchaseTokens,
    private purchaseTokensVerifyUseCase: PurchaseTokensVerify, 
    private getTokensLeftUseCase: GetTokensLeft
  ) {}

  async getTokensLeft(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const result = await this.getTokensLeftUseCase.execute(userId);
      return res.status(200).json(result);
    }
    catch (err: any) {
      console.error("Get tokens left failed", err);
      return res.status(500).json({ error: err.message || "Failed to get tokens left" });
    }
  }

  async startSession(req: any, res: Response) {
    try {
      const user = req.user;
      const { resume, role } = req.body;

      const session = await this.startSessionUseCase.execute({
        user,
        resume,
        role,
        
      });

      return res.status(200).json(session);
    } catch (err: any) {
      console.error("Start session failed", err.status);
      if(err.status ===403){
        return res.status(403).json({ error: err.message || "Insufficient tokens to start the interview." });
      }
      return res.status(500).json({ error: err.message || "Failed to start session" });
    }
  }

  async submitAnswer(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      const sessionId = req.body.sessionId;
      const role = req.body.role || "";
      const resume = req.body.resume || "";
      const personName = req.body.personName || "";
      const emotion = req.body.emotion || "Neutral";
      const expectations = req.body.expectations || "";
      const { aiQuestion, tokenUsage, satisfactionRate ,summary ,endNext ,AIemotion} = await GeminiUtility.askGemini(userId, sessionId, req.body.question , role , personName , expectations , resume, emotion);
        console.log("Satisfaction Rate", satisfactionRate);
      const updateInDb = await this.submitAnswerUseCase.execute({
        userId,
        sessionId,
        tokenUsage,
        satisfactionRate,
        endNext: endNext || false
      });
      if(updateInDb.RemaingToken < 0){
        return res.status(400).json({ error: "Insufficient tokens to continue the interview." });
      }
      return res.status(200).json({ aiQuestion , satisfactionRate:updateInDb.satisfactionScore , freeTokensRemaining: updateInDb.remainingTokens , endNext ,summary , AIemotion });
    } catch (err: any) {
      console.error("Submit answer failed", err);
      return res.status(500).json({ error: err.message || "Failed to submit answer" });
    }
  }

  async endSession(req: any, res: Response) {
    try {
      const { sessionId } = req.body;

      const result = await this.endSessionUseCase.execute(sessionId);
      return res.status(200).json({ ok: result });
    } catch (err: any) {
      console.error("End session failed", err);
      return res.status(500).json({ error: err.message || "Failed to end session" });
    }
  }

  async purchaseTokens(req: any, res: Response) {
    try {
      const userId = req.user?.id;
     

      const result = await this.purchaseTokensUseCase.execute({
        userId,

      }); 
        return res.status(200).json({ ok: result });
    } catch (err: any) {
      console.error("End session failed", err);
      return res.status(500).json({ error: err.message || "Failed to end session" });
    }
  }
async purchaseTokensVerify(req: any, res: Response) {
    try {
      const userId = req.user?.id;
      console.log(req.body);
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing required payment verification parameters." });
      }
      const result = await this.purchaseTokensVerifyUseCase.execute({
        userId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });
      return res.status(200).json({ ok: result });
    } catch (err: any) {
      console.error("End session failed", err);
      return res.status(500).json({ error: err.message || "Failed to end session" });
    }
  }

}
