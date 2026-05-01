import mongoose from "mongoose";

const vehicleBookingSchema = new mongoose.Schema({
    userId: {
        type: String,
        default: null
    },
    // Vehicle Information
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },
    vehicleName: {
        type: String,
        required: true,
        trim: true
    },
    regNo: {
        type: String,
        required: true,
        trim: true
    },
    vehicleType: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    pricePerDay: {
        type: Number,
        required: true,
        min: 0
    },

    // Booking Details
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    totalDays: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    passengers: {
        type: Number,
        required: true,
        min: 1
    },

    // Customer Information
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
    },
    specialRequests: {
        type: String,
        default: "",
        trim: true
    },
    paymentMethod: {
        type: String,
        enum: ["checkout", "online", "bank_deposit"],
        default: "checkout"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "verified", "rejected", "refunded"],
        default: "pending"
    },
    refundStatus: {
        type: String,
        enum: ["not_applicable", "pending", "processing", "refunded", "not_eligible"],
        default: "not_applicable"
    },

    // Booking Status
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Cancelled", "Completed"],
        default: "Pending"
    },

    // Timestamps
    bookingDate: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster queries
vehicleBookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });
vehicleBookingSchema.index({ customerEmail: 1 });
vehicleBookingSchema.index({ status: 1 });

const VehicleBooking = mongoose.model("VehicleBooking", vehicleBookingSchema);
export default VehicleBooking;
