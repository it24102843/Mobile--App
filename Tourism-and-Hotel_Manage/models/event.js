import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    location: {
        venue: String,
        address: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    category: {
        type: String,
        enum: ['festival', 'cultural', 'conference', 'workshop', 'entertainment'],
        required: true
    },
    image: String,
    organizer: String,
    contactInfo: {
        email: String,
        phone: String
    },
    ticketPrice: {
        type: Number,
        default: 0
    },
    capacity: Number,
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    }
}, {
    timestamps: true
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
