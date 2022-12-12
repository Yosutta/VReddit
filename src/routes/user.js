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
import checkPrivilege from "../middleware/checkPrivilege.js";
import authenticateJWT from "../middleware/authenticateJWT.js";
const upload = multer();

const router = express.Router();

router.route("/").get(getAllUsers).delete(authenticateJWT, checkPrivilege, deleteAllUser);

router
  .route("/:userId")
  .get(getUserInfo)
  .put(authenticateJWT, checkPrivilege, upload.single("profileImage"), editUserInfo)
  .delete(authenticateJWT, checkPrivilege, deleteUser);

router.put("/password/:userId", authenticateJWT, checkPrivilege, editUserPassword);
router.route("/token").post(validateToken);
router.route("/signup").post(upload.single("profileImage"), signupUser);
router.route("/login").post(loginUser);
router.route("/logout").post(authenticateJWT, logoutUser);

export default router;
