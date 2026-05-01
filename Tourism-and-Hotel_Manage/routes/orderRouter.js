import express from 'express';
import {
  approveOrRejectOrder,
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
  getQuote,
} from '../controllers/orderController.js';

const orderRouter=express.Router();

orderRouter.post("/",createOrder)
orderRouter.post("/quote",getQuote)
orderRouter.get("/",getOrders)
orderRouter.get("/:orderId", getOrderById)
orderRouter.put("/:orderId/cancel", cancelOrder)
orderRouter.put("/status/:orderId",approveOrRejectOrder)

export default orderRouter;
