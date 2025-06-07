// src/usecases/payment/VerifyPayment.ts
import { IUserRepository, VerifyPaymentInput } from "../../IReps/IUserRepo";

export class VerifyPaymentUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: VerifyPaymentInput) {
    return this.userRepo.verifyPaymentAndProcessReferral(input);
  }
}
