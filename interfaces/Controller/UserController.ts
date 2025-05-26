import express from "express";
import { PrismaClient } from "../../generated/prisma";
import { UserRepositoryImpl } from "../../infra/Repos/UserRepoImpl";
import { AuthService } from "../../application/User/Userusecase";
const router = express.Router();
const prisma = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);
const authfunction = new AuthService(userRepo);

router.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await authfunction.register(name, email, password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
router.post("/auth/signin",async(req, res) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await authfunction.signIn(email, password);
  
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
