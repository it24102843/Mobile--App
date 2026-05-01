import express from "express";
import {
    cancelMyFoodOrder,
    createFoodOrder,
    deleteFoodOrder,
    getFoodOrderById,
    getFoodOrders,
    getMyFoodOrders,
    updateFoodOrder,
    updateFoodOrderStatus,
} from "../controllers/FoodOrderController.js";

const foodOrderRouter = express.Router();

foodOrderRouter.get("/my", getMyFoodOrders);
foodOrderRouter.patch("/:id/cancel", cancelMyFoodOrder);
foodOrderRouter.get("/", getFoodOrders);
foodOrderRouter.post("/", createFoodOrder);
foodOrderRouter.get("/:id", getFoodOrderById);
foodOrderRouter.put("/:id", updateFoodOrder);
foodOrderRouter.patch("/:id/status", updateFoodOrderStatus);
foodOrderRouter.delete("/:id", deleteFoodOrder);

export default foodOrderRouter;
