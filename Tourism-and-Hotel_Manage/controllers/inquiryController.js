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

function buildMessagePayload(req, senderRole) {
  return {
    senderId: req.user?.userId || req.user?._id || null,
    senderRole,
    message: normalizeString(req.body?.message),
    readByUser: senderRole === "user",
    readByAdmin: senderRole === "admin",
    createdAt: new Date(),
  };
}

function validateMessagePayload(message) {
  if (!message.message) {
    return "Message is required.";
  }

  if (message.message.length < 2) {
    return "Message must contain at least 2 characters.";
  }

  return null;
}

function ensureMessages(inquiry) {
  if (Array.isArray(inquiry.messages) && inquiry.messages.length) {
    return inquiry.messages;
  }

  const fallbackMessages = [];

  if (normalizeString(inquiry.message)) {
    fallbackMessages.push({
      senderId: inquiry.userId || null,
      senderRole: "user",
      message: inquiry.message,
      createdAt: inquiry.date || inquiry.createdAt || new Date(),
      readByUser: true,
      readByAdmin: Boolean(inquiry.response),
    });
  }

  if (normalizeString(inquiry.response)) {
    fallbackMessages.push({
      senderId: null,
      senderRole: "admin",
      message: inquiry.response,
      createdAt: inquiry.updatedAt || new Date(),
      readByUser: false,
      readByAdmin: true,
    });
  }

  return fallbackMessages;
}

function buildUnreadCounts(messages = []) {
  return {
    unreadForUser: messages.filter((message) => message.senderRole === "admin" && !message.readByUser)
      .length,
    unreadForAdmin: messages.filter((message) => message.senderRole === "user" && !message.readByAdmin)
      .length,
  };
}

function serializeInquiry(inquiry) {
  const messages = ensureMessages(inquiry).map((message) => ({
    id: message._id || null,
    senderId: message.senderId || null,
    senderRole: message.senderRole,
    message: message.message,
    createdAt: message.createdAt,
    readByUser: Boolean(message.readByUser),
    readByAdmin: Boolean(message.readByAdmin),
  }));
  const unread = buildUnreadCounts(messages);
  const lastMessage = messages[messages.length - 1] || null;

  return {
    id: inquiry.id,
    userId: inquiry.userId || null,
    fullName: inquiry.fullName,
    email: inquiry.email,
    phone: inquiry.phone || "",
    subject: inquiry.subject,
    message: inquiry.message,
    response: inquiry.response || "",
    status: inquiry.status || (inquiry.isResolved ? "closed" : "open"),
    isResolved: Boolean(inquiry.isResolved),
    createdAt: inquiry.createdAt || inquiry.date,
    updatedAt: inquiry.updatedAt || inquiry.date,
    date: inquiry.date || inquiry.createdAt,
    messages,
    lastMessage,
    unreadForUser: unread.unreadForUser,
    unreadForAdmin: unread.unreadForAdmin,
  };
}

async function findInquiryById(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return null;
  }

  return Inquiry.findOne({ id: numericId });
}

function canAccessInquiryAsUser(req, inquiry) {
  if (!req.user) {
    return false;
  }

  if (isItAdmin(req)) {
    return true;
  }

  return inquiry.userId === req.user.userId || inquiry.email === req.user.email;
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
    const initialMessage = {
      senderId: req.user?.userId || req.user?._id || null,
      senderRole: "user",
      message: payload.message,
      createdAt: new Date(),
      readByUser: true,
      readByAdmin: false,
    };

    const newInquiry = new Inquiry({
      id,
      userId: req.user?.userId || null,
      ...payload,
      date: new Date(),
      status: "open",
      isResolved: false,
      response: "",
      messages: [initialMessage],
    });

    const response = await newInquiry.save();

    res.status(201).json({
      message: "Inquiry added successfully",
      id: response.id,
      inquiry: serializeInquiry(response),
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
      const inquiries = await Inquiry.find({
        $or: [{ userId: req.user.userId }, { email: req.user.email }],
      }).sort({ createdAt: -1, date: -1 });
      res.json(inquiries.map(serializeInquiry));
      return;
    }

    if (isItAdmin(req)) {
      const inquiries = await Inquiry.find().sort({ createdAt: -1, date: -1 });
      res.json(inquiries.map(serializeInquiry));
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

export async function getMyInquiries(req, res) {
  if (!req.user) {
    res.status(401).json({ message: "Please login to view your inquiries." });
    return;
  }

  try {
    const inquiries = await Inquiry.find({
      $or: [{ userId: req.user.userId }, { email: req.user.email }],
    }).sort({ createdAt: -1, date: -1 });

    res.json(inquiries.map(serializeInquiry));
  } catch (e) {
    res.status(500).json({ message: "Failed to load your inquiries." });
  }
}

export async function getInquiryById(req, res) {
  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    if (!canAccessInquiryAsUser(req, inquiry)) {
      res.status(403).json({ message: "You are not authorized to view this inquiry." });
      return;
    }

    res.json(serializeInquiry(inquiry));
  } catch (e) {
    res.status(500).json({ message: "Failed to load inquiry." });
  }
}

export async function addInquiryMessage(req, res) {
  if (!req.user) {
    res.status(401).json({ message: "Please login to continue this inquiry." });
    return;
  }

  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    if (!canAccessInquiryAsUser(req, inquiry) || isItAdmin(req)) {
      res.status(403).json({ message: "You are not authorized to reply to this inquiry." });
      return;
    }

    const nextMessage = buildMessagePayload(req, "user");
    const validationError = validateMessagePayload(nextMessage);

    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    inquiry.messages = ensureMessages(inquiry);
    inquiry.messages.push(nextMessage);
    inquiry.message = nextMessage.message;
    inquiry.status = "open";
    inquiry.isResolved = false;
    await inquiry.save();

    res.json({
      message: "Message sent successfully",
      inquiry: serializeInquiry(inquiry),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to send message." });
  }
}

export async function markInquiryReadByUser(req, res) {
  if (!req.user) {
    res.status(401).json({ message: "Please login to view this inquiry." });
    return;
  }

  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    if (!canAccessInquiryAsUser(req, inquiry) || isItAdmin(req)) {
      res.status(403).json({ message: "You are not authorized to update this inquiry." });
      return;
    }

    inquiry.messages = ensureMessages(inquiry).map((message) => ({
      ...message,
      readByUser: message.senderRole === "admin" ? true : message.readByUser,
    }));

    await inquiry.save();

    res.json({
      message: "Inquiry marked as read.",
      inquiry: serializeInquiry(inquiry),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to update inquiry." });
  }
}

export async function getAdminInquiries(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ message: "Admin only" });
    return;
  }

  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1, date: -1 });
    res.json(inquiries.map(serializeInquiry));
  } catch (e) {
    res.status(500).json({ message: "Unable to load inquiries." });
  }
}

export async function getAdminInquiryById(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ message: "Admin only" });
    return;
  }

  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    res.json(serializeInquiry(inquiry));
  } catch (e) {
    res.status(500).json({ message: "Unable to load inquiry." });
  }
}

export async function replyToInquiry(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ message: "Admin only" });
    return;
  }

  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    const nextMessage = buildMessagePayload(req, "admin");
    const validationError = validateMessagePayload(nextMessage);

    if (validationError) {
      res.status(400).json({ message: validationError });
      return;
    }

    inquiry.messages = ensureMessages(inquiry);
    inquiry.messages.push(nextMessage);
    inquiry.response = nextMessage.message;
    inquiry.status = inquiry.status === "closed" ? "closed" : "replied";
    inquiry.isResolved = inquiry.status === "closed";
    await inquiry.save();

    res.json({
      message: "Reply sent successfully",
      inquiry: serializeInquiry(inquiry),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to send reply." });
  }
}

export async function updateInquiryStatus(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ message: "Admin only" });
    return;
  }

  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    const nextStatus = normalizeString(req.body?.status).toLowerCase();
    if (!["open", "replied", "closed"].includes(nextStatus)) {
      res.status(400).json({ message: "Invalid inquiry status." });
      return;
    }

    inquiry.status = nextStatus;
    inquiry.isResolved = nextStatus === "closed";
    await inquiry.save();

    res.json({
      message: "Inquiry status updated successfully",
      inquiry: serializeInquiry(inquiry),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to update inquiry status." });
  }
}

export async function markInquiryReadByAdmin(req, res) {
  if (!isItAdmin(req)) {
    res.status(403).json({ message: "Admin only" });
    return;
  }

  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    inquiry.messages = ensureMessages(inquiry).map((message) => ({
      ...message,
      readByAdmin: message.senderRole === "user" ? true : message.readByAdmin,
    }));

    await inquiry.save();

    res.json({
      message: "Inquiry marked as read.",
      inquiry: serializeInquiry(inquiry),
    });
  } catch (e) {
    res.status(500).json({ message: "Failed to update inquiry." });
  }
}

export async function deleteInquiry(req, res) {
  try {
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    if (isItAdmin(req) || (isItCustomer(req) && canAccessInquiryAsUser(req, inquiry))) {
      await Inquiry.deleteOne({ _id: inquiry._id });
      res.json({ message: "Inquiry deleted successfully" });
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
    const inquiry = await findInquiryById(req.params.id);

    if (!inquiry) {
      res.status(404).json({ message: "Inquiry not found" });
      return;
    }

    if (isItAdmin(req)) {
      const nextStatus = req.body?.isResolved === true ? "closed" : inquiry.status || "open";
      if (req.body?.response !== undefined) {
        const adminMessage = buildMessagePayload(
          { ...req, body: { message: req.body.response } },
          "admin"
        );
        const validationError = validateMessagePayload(adminMessage);
        if (validationError) {
          res.status(400).json({ message: validationError });
          return;
        }

        inquiry.messages = ensureMessages(inquiry);
        inquiry.messages.push(adminMessage);
        inquiry.response = adminMessage.message;
      }

      inquiry.status = nextStatus;
      inquiry.isResolved = nextStatus === "closed";
      await inquiry.save();

      res.json({
        message: "Inquiry updated successfully",
        inquiry: serializeInquiry(inquiry),
      });
      return;
    }

    if (isItCustomer(req) && canAccessInquiryAsUser(req, inquiry)) {
      const nextMessage = buildMessagePayload(req, "user");
      const validationError = validateMessagePayload(nextMessage);

      if (validationError) {
        res.status(400).json({ message: validationError });
        return;
      }

      inquiry.messages = ensureMessages(inquiry);
      inquiry.messages.push(nextMessage);
      inquiry.message = nextMessage.message;
      inquiry.status = "open";
      inquiry.isResolved = false;
      await inquiry.save();

      res.json({
        message: "Inquiry updated successfully",
        inquiry: serializeInquiry(inquiry),
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
