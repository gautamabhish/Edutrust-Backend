// src/usecases/payment/CreateOrder.ts
import { IUserRepository, CreateOrderInput } from "../../IReps/IUserRepo";

export class CreateOrderUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(input: CreateOrderInput) {
    return this.userRepo.createOrder(input);
  }
}
