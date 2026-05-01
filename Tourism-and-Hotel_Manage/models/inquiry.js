import mongoose from "mongoose";

const inquiryMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      default: null,
    },
    senderRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    readByUser: {
      type: Boolean,
      default: false,
    },
    readByAdmin: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const inquirySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      default: null,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    response: {
      type: String,
      default: "",
      trim: true,
    },
    isResolved: {
      type: Boolean,
      required: true,
      default: false,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "replied", "closed"],
      default: "open",
    },
    messages: {
      type: [inquiryMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Inquiry = mongoose.model("Inquiries", inquirySchema);
export default Inquiry;
