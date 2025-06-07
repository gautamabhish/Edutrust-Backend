// src/Interfaces/routes/paymentRoutes.ts
import { Router } from "express";
import PaymentController from "../Controllers/PaymentController";
import { authMiddleware } from "../../middlewares/authMidlleWare";

const router = Router();

// const paymentController = new PaymentController();
// Frontend: call this first to get razorpay order details
router.post("/create",(req , res , next)=>{authMiddleware(req,res,next)}, async (req,res)=>{await PaymentController.createOrder(req, res)});

// Frontend: once Razorpay checkout completes, post back IDs/signature here
router.post("/verify",(req , res , next)=>{authMiddleware(req,res,next)}, async (req,res)=>{await PaymentController.verifyPayment(req,res)});

export  {router as paymentRoutes};
