import { Referral } from "../entity/Referal";
export interface IReferralRepo {
  create(referral: Referral): Promise<void>;
  findById(id: string): Promise<Referral | null>;
  findByReferrerId(referrerId: string): Promise<Referral[]>;
  updateEarnedAmount(id: string, amount: number): Promise<void>;
  delete(id: string): Promise<void>;
}
