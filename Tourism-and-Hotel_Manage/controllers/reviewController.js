import Review from "../models/review.js";
import {
  ALLOWED_REVIEW_SECTIONS,
  isAllowedReviewSection,
  normalizeReviewSection,
} from "../constants/reviewSections.js";

const REVIEW_SORT = { rating: -1, date: -1 };

// ADD REVIEW (rating optional)
export async function addReview(req, res) {
  if (!req.user) return res.status(401).json({ message: "Please login" });

  const data = req.body;
  const normalizedSection = normalizeReviewSection(data.section);

  data.name = `${req.user.firstName} ${req.user.lastName}`;
  data.profilePicture = req.user.profilePicture;
  data.email = req.user.email;
  data.isApproved = true;

  if (data.rating === undefined) data.rating = 0;

  if (!data.comment || !String(data.comment).trim()) {
    return res.status(400).json({ message: "Review comment is required" });
  }

  if (String(data.comment).trim().length < 10) {
    return res.status(400).json({ message: "Review comment must contain at least 10 characters" });
  }

  if (!Number.isFinite(Number(data.rating)) || Number(data.rating) < 1 || Number(data.rating) > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  if (!isAllowedReviewSection(normalizedSection)) {
    return res.status(400).json({
      message: "Please select a valid service section",
      allowedSections: ALLOWED_REVIEW_SECTIONS,
    });
  }

  data.comment = String(data.comment).trim();
  data.section = normalizedSection;

  try {
    const newReview = new Review(data);
    await newReview.save();
    res.json({ message: "Review added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Review addition failed" });
  }
}

// GET ALL REVIEWS (admin sees all, public sees approved only)
export async function getReviews(req, res) {
  try {
    const user = req.user;
    if (user && user.role === "admin") {
      const reviews = await Review.find().sort(REVIEW_SORT);
      return res.json(reviews);
    }
    const reviews = await Review.find({ isApproved: true }).sort(REVIEW_SORT);
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get reviews" });
  }
}

// GET USER'S OWN REVIEWS (all of them)
export async function getUserReviews(req, res) {
  if (!req.user) return res.status(401).json({ message: "Please login" });
  try {
    const reviews = await Review.find({ email: req.user.email }).sort(REVIEW_SORT);
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch your reviews" });
  }
}

// GET ONE REVIEW
export async function getReviewById(req, res) {
  const { id } = req.params;

  try {
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const user = req.user;
    const isOwner = user && review.email === user.email;
    const isAdmin = user && user.role === "admin";

    if (!review.isApproved && !isOwner && !isAdmin) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get review" });
  }
}

// UPDATE REVIEW (user can update own, reset approval)
export async function updateReview(req, res) {
  const { id } = req.params;
  const { rating, comment, section } = req.body;

  if (!req.user) return res.status(401).json({ message: "Please login" });

  try {
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.email !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (rating !== undefined) {
      const nextRating = Number(rating);
      if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = nextRating;
    }

    if (comment !== undefined) {
      if (!String(comment).trim()) {
        return res.status(400).json({ message: "Review comment is required" });
      }
      if (String(comment).trim().length < 10) {
        return res.status(400).json({ message: "Review comment must contain at least 10 characters" });
      }
      review.comment = String(comment).trim();
    }

    if (section !== undefined) {
      const normalizedSection = normalizeReviewSection(section);
      if (!isAllowedReviewSection(normalizedSection)) {
        return res.status(400).json({
          message: "Please select a valid service section",
          allowedSections: ALLOWED_REVIEW_SECTIONS,
        });
      }
      review.section = normalizedSection;
    }

    if (review.isApproved) review.isApproved = false;
    review.date = new Date();

    await review.save();
    res.json({ message: "Review updated successfully", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
}

// DELETE REVIEW BY ID (user or admin)
export async function deleteReviewById(req, res) {
  const { id } = req.params;
  if (!req.user) return res.status(401).json({ message: "Please login" });

  try {
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.email !== req.user.email && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Review.findByIdAndDelete(id);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Deletion failed" });
  }
}

// APPROVE REVIEW BY ID (admin only)
export async function approveReviewById(req, res) {
  const { id } = req.params;
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const review = await Review.findByIdAndUpdate(id, { isApproved: true }, { new: true });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review approved", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Approval failed" });
  }
}

// REJECT REVIEW BY ID (admin only)
export async function rejectReviewById(req, res) {
  const { id } = req.params;
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const review = await Review.findByIdAndUpdate(id, { isApproved: false }, { new: true });
    if (!review) return res.status(404).json({ message: "Review not found" });
    res.json({ message: "Review rejected", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Rejection failed" });
  }
}
