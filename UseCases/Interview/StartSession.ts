import { IUserRepository } from "../../IReps/IUserRepo";

export class StartInterviewSession {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: { user: any; resume: string; role: string;  }) {
    const { user, resume, role } = input;
    if (!user) {
      throw new Error("User not authenticated");
    }
    if (!resume || !role) {
      throw new Error("Resume and role are required to start a session");
    }

    // Start the interview session
    const session = await this.userRepo.startInterviewSession(user.id, role, resume);

    return {
      sessionId: session.sessionId,
      freeTokensRemaining: session.freeTokensRemaining,
    };
  }
}

export class SubmitInterviewAnswer {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: { userId: string , sessionId: string; satisfactionRate: number; tokenUsage: number , endNext: boolean}) {
   const {userId , sessionId , tokenUsage ,satisfactionRate , endNext} = input ;
   console.log("Input to SubmitInterviewAnswer:", input);
    if (!sessionId || !tokenUsage || !satisfactionRate) {
      throw new Error("Session ID, token usage, and satisfaction rate are required");
    }

    // Submit the answer and get the next question
    const result = await this.userRepo.submitInterviewSessionQuestionAnswer(userId , sessionId,tokenUsage ,  satisfactionRate , endNext);

    return result;
  }
}
export class GetTokensLeft {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const tokensLeft = await this.userRepo.getInterviewTokensLeft(userId);
    return { tokensLeft };
  }
}
export class EndInterviewSession {
  constructor(private userRepo: IUserRepository) {}

  async execute(sessionId: string) {
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    await this.userRepo.endInterviewSession(sessionId);
    return true;
  }
}

export class PurchaseTokens {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: { userId: string}) {
    const { userId } = input;
    if (!userId ) {
      throw new Error("User ID, order ID, and amount are required");
    }

    const order = await this.userRepo.createInterviewOrder({
      userId,
     
    });

    return order;
  }
}   
export class PurchaseTokensVerify {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: { userId: string, razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string}) {
    const { userId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = input;
    if (!userId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      throw new Error("User ID, payment ID, order ID, and signature are required");
    }

    const result = await this.userRepo.purchaseTokensVerify({
      userId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    });

    return result;
  }


}