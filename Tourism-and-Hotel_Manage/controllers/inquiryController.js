import Inquiry from "../models/inquiry.js";
import { isItAdmin, isItCustomer } from "./userController.js";

function normalizeString(value) {
  return `${value ?? ""}`.trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeString(value).replace(/\s+/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^\+?[0-9\-()]{7,20}$/.test(phone);
}

function resolveNameFromUser(user) {
  return `${normalizeString(user?.firstName)} ${normalizeString(user?.lastName)}`.trim();
}

async function getNextInquiryId() {
  const inquiries = await Inquiry.find().sort({ id: -1 }).limit(1);
  return inquiries.length === 0 ? 1 : inquiries[0].id + 1;
}

function buildInquiryPayload(req) {
  const userName = resolveNameFromUser(req.user);
  const fullName = userName || normalizeString(req.body?.fullName);
  const email = normalizeEmail(req.user?.email || req.body?.email);
  const phone = normalizePhone(req.body?.phone || req.user?.phone);
  const subject = normalizeString(req.body?.subject);
  const message = normalizeString(req.body?.message);

  return {
    fullName,
    email,
    phone,
    subject,
    message,
  };
}

function validateInquiryPayload(payload) {
  if (!payload.fullName) {
    return "Full name is required.";
  }

  if (payload.fullName.length < 3) {
    return "Full name must contain at least 3 characters.";
  }

  if (!payload.email) {
    return "Email is required.";
  }

  if (!isValidEmail(payload.email)) {
    return "Please enter a valid email address.";
  }

  if (payload.phone && !isValidPhone(payload.phone)) {
    return "Please enter a valid phone number.";
  }

  if (!payload.subject) {
    return "Subject is required.";
  }

  if (!payload.message) {
    return "Message is required.";
  }

  if (payload.message.length < 10) {
    return "Message must contain at least 10 characters.";
  }

  return null;
}

export async function addInquiry(req, res) {
  try {
    const payload = buildInquiryPayload(req);
    const validationError = validateInquiryPayload(payload);

    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    const id = await getNextInquiryId();

    const newInquiry = new Inquiry({
      id,
      ...payload,
    });

    const response = await newInquiry.save();

    res.status(201).json({
      message: "Inquiry added successfully",
      id: response.id,
      inquiry: response,
    });
  } catch (e) {
    res.status(500).json({
      message: "Failed to add inquiry",
    });
  }
}

export async function getInquiries(req, res) {
  try {
    if (isItCustomer(req)) {
      const inquiries = await Inquiry.find({ email: req.user.email }).sort({ date: -1 });
      res.json(inquiries);
      return;
    }

    if (isItAdmin(req)) {
      const inquiries = await Inquiry.find().sort({ date: -1 });
      res.json(inquiries);
      return;
    }

    res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  } catch (e) {
    res.status(500).json({
      message: "Fail to get inquiries",
    });
  }
}

export async function deleteInquiry(req, res) {
  try {
    const id = req.params.id;

    if (isItAdmin(req)) {
      await Inquiry.deleteOne({ id: id });
      res.json({
        message: "Inquiry deleted successfully",
      });
      return;
    }

    if (isItCustomer(req)) {
      const inquiry = await Inquiry.findOne({ id: id });

      if (inquiry == null) {
        res.status(404).json({
          message: "Inquiry not found",
        });
        return;
      }

      if (inquiry.email === req.user.email) {
        await Inquiry.deleteOne({ id: id });
        res.json({
          message: "Inquiry deleted successfully",
        });
        return;
      }

      res.status(403).json({
        message: "You are not authorized to perform this action",
      });
      return;
    }

    res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  } catch (e) {
    res.status(500).json({
      message: "Failed to delete inquiry",
    });
  }
}

export async function updateInquiry(req, res) {
  try {
    const id = req.params.id;

    if (isItAdmin(req)) {
      const updatePayload = {};

      if (req.body?.response !== undefined) {
        updatePayload.response = normalizeString(req.body.response);
      }

      if (req.body?.isResolved !== undefined) {
        updatePayload.isResolved = Boolean(req.body.isResolved);
      }

      if (req.body?.subject !== undefined) {
        updatePayload.subject = normalizeString(req.body.subject);
      }

      if (req.body?.message !== undefined) {
        updatePayload.message = normalizeString(req.body.message);
      }

      await Inquiry.updateOne({ id: id }, updatePayload);
      res.json({
        message: "Inquiry updated successfully",
      });
      return;
    }

    if (isItCustomer(req)) {
      const inquiry = await Inquiry.findOne({ id: id });

      if (inquiry == null) {
        res.status(404).json({
          message: "Inquiry not found",
        });
        return;
      }

      if (inquiry.email !== req.user.email) {
        res.status(403).json({
          message: "You are not authorized to perform this action",
        });
        return;
      }

      const nextMessage = normalizeString(req.body?.message);

      if (!nextMessage) {
        res.status(400).json({
          message: "Message is required.",
        });
        return;
      }

      if (nextMessage.length < 10) {
        res.status(400).json({
          message: "Message must contain at least 10 characters.",
        });
        return;
      }

      await Inquiry.updateOne({ id: id }, { message: nextMessage });
      res.json({
        message: "Inquiry updated successfully",
      });
      return;
    }

    res.status(403).json({
      message: "You are not authorized to perform this action",
    });
  } catch (e) {
    res.status(500).json({
      message: "Failed to update inquiry",
    });
  }
}
