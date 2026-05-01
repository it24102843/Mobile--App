import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema({
    hotelId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    starRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 3
    },
    contactEmail: {
        type: String,
        default: ""
    },
    contactPhone: {
        type: String,
        default: ""
    },
    amenities: {
        pool:       { type: Boolean, default: false },
        spa:        { type: Boolean, default: false },
        gym:        { type: Boolean, default: false },
        restaurant: { type: Boolean, default: false },
        bar:        { type: Boolean, default: false },
        beachAccess:{ type: Boolean, default: false }
    },
    images: {
        type: [String],
        default: ["https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg"]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Hotel = mongoose.model("Hotel", hotelSchema);
export default Hotel;
