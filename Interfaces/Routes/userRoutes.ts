// interface/routes/userRoutes.ts
import express from "express";
import { PrismaClient } from "../../generated/prisma";
import { UserRepositoryImpl } from "../../InfraReps/UserImpl";
import { LoginUser } from "../../UseCases/User/Login";
import { RegisterUser } from "../../UseCases/User/Register";
import { UserController } from "../../Interfaces/Controllers/UserController";
const router = express.Router();
const prisma = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);

const registerUser = new RegisterUser(userRepo);
const loginUser = new LoginUser(userRepo);
const controller = new UserController(registerUser, loginUser);

router.post("/register", (req, res) => controller.register(req, res));
router.post("/login", (req, res) => controller.login(req, res));

export default router;
