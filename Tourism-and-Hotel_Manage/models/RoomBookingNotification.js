import mongoose from "mongoose";

const roomBookingNotificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            default: "room_booking_cancelled",
            enum: ["room_booking_cancelled"]
        },
        bookingId: {
            type: String,
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        email: {
            type: String,
            required: true
        },
        bookingSnapshot: {
            room: {
                hotelName: { type: String, default: "" },
                roomType: { type: String, default: "" },
                roomNumber: { type: String, default: "" },
                image: { type: String, default: "" }
            },
            checkInDate: { type: Date, default: null },
            checkOutDate: { type: Date, default: null },
            numberOfGuests: { type: Number, default: 0 },
            numberOfNights: { type: Number, default: 0 },
            totalAmount: { type: Number, default: 0 },
            paymentMethod: { type: String, default: "" },
            refundMessage: { type: String, default: "" },
            refundStatus: { type: String, default: "" }
        },
        cancellationDate: {
            type: Date,
            required: true
        },
        notificationMessage: {
            type: String,
            default: "A room booking was cancelled by the customer."
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

const RoomBookingNotification = mongoose.model(
    "RoomBookingNotification",
    roomBookingNotificationSchema
);

export default RoomBookingNotification;
