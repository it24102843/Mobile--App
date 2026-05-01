import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["Mahindra Jeep", "Toyota Hilux", "Safari Jeep", "Land Cruiser", "Minibus", "Van"],
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    capacity: {
        type: Number,
        required: true,
        default: 6,
    },
    pricePerDay: {
        type: Number,
        required: true,
    },
    features: {
        ac:            { type: Boolean, default: false },
        openRoof:      { type: Boolean, default: false }, // for safari jeeps
        fourWheelDrive:{ type: Boolean, default: false },
        wifi:          { type: Boolean, default: false },
        firstAidKit:   { type: Boolean, default: true  },
        coolerBox:     { type: Boolean, default: false },
    },
    description: {
        type: String,
        default: "",
    },
    images: {
        type: [String],
        default: [],
    },
    availability: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ["Available", "On Trip", "Maintenance"],
        default: "Available",
    },
    // Which packages this vehicle can be assigned to
    assignedPackages: {
        type: [String], // packageIds
        default: [],
    },
    driverName: {
        type: String,
        default: "",
    },
    driverPhone: {
        type: String,
        default: "",
    },
}, { timestamps: true });

const PackageVehicle = mongoose.model("PackageVehicle", vehicleSchema);
export default PackageVehicle;
