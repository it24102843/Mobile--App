import express from "express";
import {
  addInquiry,
  addInquiryMessage,
  deleteInquiry,
  getAdminInquiries,
  getAdminInquiryById,
  getInquiries,
  getInquiryById,
  getMyInquiries,
  markInquiryReadByAdmin,
  markInquiryReadByUser,
  replyToInquiry,
  updateInquiry,
  updateInquiryStatus,
} from "../controllers/inquiryController.js";

const inquiryRouter = express.Router();
const adminInquiryRouter = express.Router();

inquiryRouter.post("/", addInquiry);
inquiryRouter.get("/", getInquiries);
inquiryRouter.get("/my", getMyInquiries);
inquiryRouter.get("/:id", getInquiryById);
inquiryRouter.post("/:id/messages", addInquiryMessage);
inquiryRouter.patch("/:id/read-user", markInquiryReadByUser);
inquiryRouter.delete("/:id", deleteInquiry);
inquiryRouter.put("/:id", updateInquiry);

adminInquiryRouter.get("/", getAdminInquiries);
adminInquiryRouter.get("/:id", getAdminInquiryById);
adminInquiryRouter.post("/:id/reply", replyToInquiry);
adminInquiryRouter.patch("/:id/status", updateInquiryStatus);
adminInquiryRouter.patch("/:id/read-admin", markInquiryReadByAdmin);

export { adminInquiryRouter };
export default inquiryRouter;
