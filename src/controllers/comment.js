import Post from "../models/post.js";
import Comment from "../models/comment.js";
import {
  generateErrorResponse,
  NotFoundResponse,
  BadRequestResponse,
  InternalServerErrorResponse,
  ForbiddenResponse,
} from "../utils/error.js";
import { OKHTTPResponse } from "../utils/response.js";
import _ from "lodash";

import * as path from "path";
import { fileURLToPath } from "url";
const fileName = path.basename(fileURLToPath(import.meta.url)).slice(0, -3);

export async function getPostInitialComments(req, res) {
  try {
    const postId = req.body.postId;
    const foundPost = await Post.getPost(postId);
    // Check if post with postId exists
    if (!foundPost) throw new NotFoundResponse(null, `Post with id ${postId} not found`);
    const foundInitialComments = await Comment.getParentCommentsByPostId(postId);
    const response = new OKHTTPResponse(`Finished fetching all initial comments with postId ${postId}`, {
      foundInitialComments,
    });
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function getAllChildComments(req, res) {
  try {
    const postId = req.body.postId;
    const parentId = req.params.parentId;
    // Check if post with postId exists
    const foundPost = await Post.getPost(postId);
    if (!foundPost) throw new NotFoundResponse(null, `Post with id ${postId} not found`);
    // Check if inital comment with parentId exist
    const foundParentComment = await Comment.getCommentById(parentId);
    if (!foundParentComment) {
      const response = new OKHTTPResponse(null, `Comment with parentId ${parentId} does not exist`);
      return res.status(response.statusCode).json(response);
    }
    // Check if intial comment with parentId has replies
    if (foundParentComment.replyCount === 0) {
      const response = new OKHTTPResponse(null, `Comment with parentId ${parentId} has no replies`);
      return res.status(response.statusCode).json(response);
    }
    const foundChildComments = await Comment.getChildCommentsByParentId(postId, parentId);
    // Check if childs of initial comment count equal to replyCount
    if (foundChildComments.length - 1 !== foundParentComment.replyCount)
      throw new InternalServerErrorResponse(
        "Database error",
        "Parrent comment replyCount and actual replies number do not match"
      );
    const response = new OKHTTPResponse(null, { foundChildComments });
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function createComment(req, res) {
  try {
    const { postId, commentText } = req.body;
    let parentId;
    if (!req.body.parentId) parentId = null;
    else parentId = req.body.parentId;
    const userId = req.loggedInId;
    if (!postId) throw new BadRequestResponse(null, `Post Id not provided`);
    // Check if post exist
    const foundPost = await Post.getPost(postId);
    if (!foundPost) throw new NotFoundResponse(null, `Post with id ${postId} not found`);
    // Check if comment with id value [parrentId] exist
    if (parentId) {
      const foundCommentByParentId = await Comment.getCommentById(parentId);
      if (!foundCommentByParentId) {
        parentId = null;
      }
    }
    const result = await Comment.createCommentOnPostId(postId, parentId, userId, { commentText });
    if (result.affectedRows === 0) {
      throw new InternalServerErrorResponse("Database error", "No new comment is created");
    }
    await Comment.updateInitialCommentReplyCount(parentId);
    const response = new OKHTTPResponse("Successfully added a new comment", result);
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function editComment(req, res) {
  try {
    const { commentId } = req.params;
    const userId = req.loggedInId;
    const commentText = req.body.commentText;
    const foundComment = await Comment.getCommentById(commentId);
    // Check if comment with commentId exist
    if (!foundComment) {
      const response = NotFoundResponse.withMessage(`Comment with id ${commentId} not found`);
      return res.status(response.statusCode).json(response);
    }
    // Check if comment belongs to currently loggedIn user
    if (foundComment.userId !== userId) {
      const response = ForbiddenResponse.withMessage("User can not modify post belongs to a different user.");
      return res.status(response.statusCode).json(response);
    }
    const result = await Comment.editCommentById(commentId, commentText);
    //Check if comment is edited
    if (result.affectedRows === 0) throw new InternalServerErrorResponse.withMessage("Comment was not edited");
    const response = new OKHTTPResponse("Edited a comment", result);
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    const userId = req.loggedInId;
    const foundComment = await Comment.getCommentById(commentId);
    // Check if comment with commentId exist
    if (!foundComment) {
      const response = NotFoundResponse.withMessage(`Comment with id ${commentId} not found`);
      return res.status(response.statusCode).json(response);
    }
    // Check if comment belongs to currently loggedIn user
    if (foundComment.userId !== userId) {
      const response = ForbiddenResponse.withMessage("User can not modify comment belongs to a different user.");
      return res.status(response.statusCode).json(response);
    }
    const deleteRepliesPromise = new Promise((resolve, reject) => {
      const resultDeleteReplies = Comment.deleteCommentByParentId(commentId);
      if (resultDeleteReplies) {
        resolve(resultDeleteReplies);
      } else reject(resultDeleteReplies);
    });
    // Delete initial comment
    const result = await Comment.deleteCommentById(commentId);
    //Check if comment is deleted
    if (result.affectedRows === 0) throw new InternalServerErrorResponse.withMessage("Comment was not deleted");
    await Comment.updateInitialCommentReplyCount(foundComment.parentId);
    const response = new OKHTTPResponse("Deleted a comment", result);
    res.status(response.statusCode).json(response);

    deleteRepliesPromise
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log("Logging error" + err);
      });
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}
