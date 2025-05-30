// interface/routes/userRoutes.ts
import express from "express";
import { PrismaClient } from "../../generated/prisma";
import { UserRepositoryImpl } from "../../InfraReps/UserImpl";
import { LoginUser } from "../../UseCases/User/Login";
import { RegisterUser } from "../../UseCases/User/Register";
import { UserController } from "../../Interfaces/Controllers/UserController";
import { GetUserDashboard } from "../../UseCases/User/GetDashboard";
const router = express.Router();
const prisma = new PrismaClient();
const userRepo = new UserRepositoryImpl(prisma);

const registerUser = new RegisterUser(userRepo);
const loginUser = new LoginUser(userRepo);
const getDashBoard = new GetUserDashboard(userRepo);
const controller = new UserController(registerUser, loginUser, getDashBoard);
router.post("/register", async (req, res) => {await controller.register(req, res)});
router.post("/login", async(req, res) => {await controller.login(req, res)});
router.get("/dashboard/",async (req, res) => { await controller.getDashBoard(req, res)});
export default router;
