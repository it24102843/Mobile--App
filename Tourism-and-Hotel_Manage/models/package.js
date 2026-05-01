import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
    packageId: {
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
    category: {
        type: String,
        required: true,
        enum: ["Safari", "Wildlife", "Pilgrimage", "Adventure", "Cultural", "Nature", "Combined"],
        default: "Safari"
    },
    description: {
        type: String,
        required: true
    },
    highlights: {
        type: [String],
        default: []
    },
    duration: {
        days: { type: Number, required: true, default: 1 },
        nights: { type: Number, required: true, default: 0 }
    },
    price: {
        type: Number,
        required: true
    },
    maxGroupSize: {
        type: Number,
        default: 10
    },
    includes: {
        type: [String],
        default: []
    },
    excludes: {
        type: [String],
        default: []
    },
    meetingPoint: {
        type: String,
        default: "Kataragama Town Center"
    },
    availability: {
        type: Boolean,
        default: true
    },
    customizationEnabled: {
        type: Boolean,
        default: true
    },
    images: {
        type: [String],
        default: ["https://www.shutterstock.com/image-vector/missing-picture-page-website-design-600nw-1552421075.jpg"]
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
}, { timestamps: true });

const Package = mongoose.model("Package", packageSchema);
export default Package;
