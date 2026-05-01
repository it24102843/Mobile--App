import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Menu",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        default: "Main Course"
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    preparationTime: {
        type: Number,
        default: null
    },
    availability: {
        type: Boolean,
        default: true
    },
    image: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const FoodItem = mongoose.model("FoodItem", foodItemSchema);
export default FoodItem;