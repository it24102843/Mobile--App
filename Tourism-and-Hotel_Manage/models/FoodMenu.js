import mongoose from "mongoose";

const menuSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: {
        type: String,
        required: true   // e.g. "Breakfast", "Lunch", "Dinner"
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Menu = mongoose.model("Menu", menuSchema);
export default Menu;
