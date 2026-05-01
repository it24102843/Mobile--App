import express from "express";
import { protect } from "../middleware/auth.js";
import {
    addReview,
    getReviews,
    getReviewById,
    getUserReviews,
    updateReview,
    deleteReviewById,
    approveReviewById,
    rejectReviewById,
    replyToReviewById,
    getUnreadReviewReplyCount,
    markReviewReplyRead,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", protect, addReview);               // POST /api/reviews
reviewRouter.get("/", getReviews);                         // GET /api/reviews
reviewRouter.get("/my-reviews", protect, getUserReviews);  // GET /api/reviews/my-reviews
reviewRouter.get("/my/replies/unread-count", protect, getUnreadReviewReplyCount);
reviewRouter.get("/:id", getReviewById);                   // GET /api/reviews/:id
reviewRouter.put("/:id", protect, updateReview);           // PUT /api/reviews/:id
reviewRouter.delete("/:id", protect, deleteReviewById);    // DELETE /api/reviews/:id
reviewRouter.put("/:id/approve", protect, approveReviewById); // PUT /api/reviews/:id/approve
reviewRouter.put("/:id/reject", protect, rejectReviewById);   // PUT /api/reviews/:id/reject
reviewRouter.post("/:id/reply", protect, replyToReviewById);
reviewRouter.patch("/:id/reply/read", protect, markReviewReplyRead);

export default reviewRouter;
