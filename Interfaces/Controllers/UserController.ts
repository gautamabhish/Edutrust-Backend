// interface/controllers/UserController.ts
import { Request, Response } from "express";
import { RegisterUser } from "../../UseCases/User/Register";
import { LoginUser } from "../../UseCases/User/Login";
export class UserController {
  constructor(
    private registerUser: RegisterUser,
    private loginUser: LoginUser
  ) {}

  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;
      const result = await this.registerUser.execute(name, email, password);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.loginUser.execute(email, password);
      res.status(200).json(result);
    } catch (err:any) {
      res.status(401).json({ error: err.message });
    }
  }
}
