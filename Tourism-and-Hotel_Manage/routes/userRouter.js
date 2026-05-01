import express from "express";
import {
  blockOrUnblockUser,
  blockOrUnblockUserById,
  deleteUserById,
  getAllUsers,
  getUser,
  getUserById,
  loginUser,
  loginWithGoogle,
  registerUser,
  updateUserById,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/google", loginWithGoogle);

userRouter.get("/all", getAllUsers);
userRouter.get("/details/:userId", getUserById);
userRouter.put("/block/:email", blockOrUnblockUser);
userRouter.patch("/:userId/block", blockOrUnblockUserById);
userRouter.put("/:userId", updateUserById);
userRouter.delete("/:userId", deleteUserById);
userRouter.get("/", getUser);

export default userRouter;
