import express from "express";
import { getAllPosts, createPost, deleteAllPosts, getPost, updatePost, deletePost } from "../controllers/post.js";
import authenticateJWT from "../middleware/authenticateJWT.js";

const router = express.Router();

router
  .route("/")

  .get(getAllPosts)
  .post(authenticateJWT, createPost)
  .delete(deleteAllPosts);

router
  .route("/:id")

  .get(getPost)
  .put(updatePost)
  .delete(deletePost);

export default router;
