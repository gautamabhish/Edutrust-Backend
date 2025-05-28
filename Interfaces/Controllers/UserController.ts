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
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const {user,token} = await this.loginUser.execute(email, password);
     
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    });
      return res.status(200).json( {user} );
    } catch (err:any) {
        return res.status(401).json({ error: err.message });
    }
  }
}
