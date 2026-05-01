import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        required: true
    },
    openingHours: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
export default Restaurant;