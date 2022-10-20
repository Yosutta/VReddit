import express from "express";
import multer from "multer";
import {
  signupUser,
  deleteAllUser,
  deleteUser,
  editUserInfo,
  getAllUsers,
  getUserInfo,
  loginUser,
  validateToken,
  logoutUser,
  editUserPassword,
} from "../controllers/user.js";
import authenticateJWT from "../middleware/authenticateJWT.js";
const upload = multer();

const router = express.Router();

router.route("/").get(getAllUsers).delete(deleteAllUser);
router
  .route("/:userId")
  .get(authenticateJWT, getUserInfo)
  .put(authenticateJWT, upload.single("profileImage"), editUserInfo)
  .delete(authenticateJWT, deleteUser);
router.put("/password/:userId", authenticateJWT, editUserPassword);
router.route("/token").post(validateToken);
router.route("/signup").post(upload.single("profileImage"), signupUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);

export default router;
