import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema({
    name: String,
    location: {
        lat: Number,
        lng: Number
    },
    address: String,
    visitDate: Date,
    duration: Number,
    notes: String
});

const bookingRouteSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hotelLocation: {
        name: String,
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    selectedDestinations: [destinationSchema],
    optimizedRoute: {
        waypoints: [{
            location: String,
            stopover: Boolean
        }],
        totalDistance: Number,
        totalDuration: Number,
        polyline: String
    },
    status: {
        type: String,
        enum: ['pending', 'generated', 'sent'],
        default: 'pending'
    },
    mapImageUrl: String,
    shareableLink: String
}, {
    timestamps: true
});

export default mongoose.model('BookingRoute', bookingRouteSchema);