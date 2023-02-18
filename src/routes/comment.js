import express from "express";
import authenticateJWT from "../middleware/authenticateJWT.js";
import checkPrivilege from "../middleware/checkPrivilege.js";
import {
  createComment,
  deleteComment,
  editComment,
  getAllChildComments,
  getPostInitialComments,
} from "../controllers/comment.js";

const router = express.Router();

router.route("/").get(getPostInitialComments).post(authenticateJWT, checkPrivilege, createComment);

router.route("/:parentId").get(getAllChildComments);

router
  .route("/:commentId")
  .post()
  .put(authenticateJWT, checkPrivilege, editComment)
  .delete(authenticateJWT, checkPrivilege, deleteComment);

export default router;
