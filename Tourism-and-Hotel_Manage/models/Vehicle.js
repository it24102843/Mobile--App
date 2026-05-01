import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        default: "Safari Jeep"
    },
    capacity: {
        type: Number,
        required: true
    },
    pricePerDay: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    driverName: {
        type: String,
        default: ""
    },
    driverContact: {
        type: String,
        default: ""
    },
    availability: {
        type: Boolean,
        default: true
    },
    image: {
        type: [String],
        default: []
    }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;