import mongoose from "mongoose";

const packageBookingNotificationSchema = new mongoose.Schema(
    {
        bookingId: { type: String, required: true, index: true },
        userId: { type: String, default: null },
        userName: { type: String, default: "Guest" },
        userEmail: { type: String, default: "" },
        packageId: { type: String, default: "" },
        packageName: { type: String, default: "Package Booking" },
        tourDate: { type: Date, default: null },
        guests: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        paymentMethod: { type: String, default: "checkout" },
        status: { type: String, default: "Pending" },
        type: {
            type: String,
            enum: ["created", "cancelled", "updated"],
            default: "created"
        },
        note: { type: String, default: "" },
        isRead: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const PackageBookingNotification = mongoose.model(
    "PackageBookingNotification",
    packageBookingNotificationSchema
);

export default PackageBookingNotification;
