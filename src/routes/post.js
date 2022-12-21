import express from "express";
import {
  getAllPosts,
  createPost,
  deleteAllPosts,
  getPost,
  updatePost,
  deletePost,
  getPostAndAuthorDetail,
} from "../controllers/post.js";
import authenticateJWT from "../middleware/authenticateJWT.js";
import checkPrivilege from "../middleware/checkPrivilege.js";

const router = express.Router();

router
  .route("/")
  .get(getAllPosts)
  .post(authenticateJWT, checkPrivilege, createPost)
  .delete(authenticateJWT, checkPrivilege, deleteAllPosts);

router
  .route("/:postId")

  .get(getPostAndAuthorDetail)
  .put(authenticateJWT, checkPrivilege, updatePost)
  .delete(authenticateJWT, checkPrivilege, deletePost);

export default router;
