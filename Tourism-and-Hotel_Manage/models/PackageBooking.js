import mongoose from "mongoose";

const packageBookingSchema = new mongoose.Schema({
    bookingId:   { type: String, required: true, unique: true },
    userId:      { type: String, default: null },
    packageId:   { type: String, required: true },
    packageName: { type: String, required: true },
    packageImage: { type: String, default: "" },
    userEmail:   { type: String, required: true },
    userName:    { type: String, required: true },
    userPhone:   { type: String, default: "" },
    tourDate:    { type: Date, required: true },
    guests:      { type: Number, required: true, min: 1 },
    selectedActivities: { type: [String], default: [] },

    // Vehicle selected by user
    selectedVehicle: {
        vehicleId:          { type: String, default: null },
        vehicleName:        { type: String, default: null },
        vehicleType:        { type: String, default: null },
        vehiclePricePerDay: { type: Number, default: 0 },
    },

    mealPackage: {
        breakfast: { type: Boolean, default: false },
        lunch: { type: Boolean, default: false },
        price: { type: Number, default: 0 },
    },

    addOns: { type: [mongoose.Schema.Types.Mixed], default: [] },
    specialRequests:    { type: String, default: "" },
    basePricePerPerson: { type: Number, required: true },
    vehicleTotal:       { type: Number, default: 0 },
    addOnTotal:         { type: Number, default: 0 },
    totalPrice:         { type: Number, required: true },
    paymentMethod: {
        type: String,
        enum: ["checkout", "online", "bank_deposit"],
        default: "checkout",
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "verified", "rejected", "refunded"],
        default: "pending",
    },
    refundStatus: {
        type: String,
        enum: ["not_applicable", "pending", "processing", "refunded", "not_eligible"],
        default: "not_applicable",
    },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
        default: "Pending",
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

const PackageBooking = mongoose.model("PackageBooking", packageBookingSchema);
export default PackageBooking;
