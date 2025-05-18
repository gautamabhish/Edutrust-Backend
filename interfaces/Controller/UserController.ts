import express from "express";
import { PrismaClient } from "@prisma/client";
import { UserRepositoryImpl } from "../../infra/Repos/UserRepoImpl";
import { RegisterUser } from "../../application/User/RegisterUser";
import { SignInUser } from "../../application/User/SignInUser";
const router = express.Router();
const prisma = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);
const registerUser = new RegisterUser(userRepo);
const signInUseCase = new SignInUser(userRepo);

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser.execute(name, email, password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
router.post("/signin",async(req, res) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await signInUseCase.execute(email, password);
  
      res.status(200).json({
        message: "Sign in successful",
        // 🔥 Here’s the JWT
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          token, 
        },
      });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }})
export default router;
