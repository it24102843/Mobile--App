import mongoose from "mongoose";

const foodOrderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: String,
            required: true,
            index: true,
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        menuId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Menu",
            required: true,
        },
        foodItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodItem",
            required: true,
        },
        restaurantName: {
            type: String,
            required: true,
        },
        menuName: {
            type: String,
            default: "",
        },
        foodName: {
            type: String,
            required: true,
        },
        foodImage: {
            type: [String],
            default: [],
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        customerName: {
            type: String,
            required: true,
        },
        customerEmail: {
            type: String,
            required: true,
            index: true,
        },
        customerPhone: {
            type: String,
            required: true,
        },
        fulfillmentMethod: {
            type: String,
            enum: ["Pickup", "Delivery"],
            default: "Pickup",
        },
        specialNote: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Preparing", "Completed", "Cancelled"],
            default: "Pending",
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const FoodOrder = mongoose.model("FoodOrder", foodOrderSchema);

export default FoodOrder;
