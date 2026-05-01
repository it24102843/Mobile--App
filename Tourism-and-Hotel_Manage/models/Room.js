import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    hotelName: {
        type: String,
        required: true
    },
    roomType: {
        type: String,
        required: true,
        enum: ["Standard", "Deluxe", "Suite", "Family Suite", "Pool Villa", "Garden Cottage"]
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        default: 2
    },
    availability: {
        type: Boolean,
        required: true,
        default: true
    },
    status: {
        type: String,
        required: true,
        default: "Available",
        enum: ["Available", "Booked", "Maintenance"]
    },
    facilities: {
        ac:       { type: Boolean, default: false },
        wifi:     { type: Boolean, default: true  },
        parking:  { type: Boolean, default: false },
        tv:       { type: Boolean, default: false },
        hotWater: { type: Boolean, default: true  },
        miniBar:  { type: Boolean, default: false }
    },
    images: {
        type: [String],
        required: true,
        default: ["https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg"]
    }
}, { timestamps: true });

const Room = mongoose.model("Room", roomSchema);
export default Room;