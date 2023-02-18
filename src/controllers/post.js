import Post from "../models/post.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { NotFoundResponse, generateErrorResponse, ForbiddenResponse } from "../utils/error.js";
import { OKHTTPResponse } from "../utils/response.js";
import * as path from "path";
import { fileURLToPath } from "url";

const fileName = path.basename(fileURLToPath(import.meta.url)).slice(0, -3);

export async function getAllPosts(req, res) {
  try {
    const foundPosts = await Post.getAllPosts();
    let response;
    !foundPosts.length
      ? (response = new NotFoundResponse(undefined, "Posts are not found"))
      : (response = new OKHTTPResponse(undefined, { foundPosts }));
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function createPost(req, res) {
  try {
    const { title, content } = req.body;
    const userId = req.loggedInId;
    console.log(userId);
    const result = await Post.createPost({ title, content, userId });
    const response = new OKHTTPResponse("New post created", result);
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function deleteAllPosts(req, res) {
  try {
    const result = await Post.deleteAllPosts();
    const response = new OKHTTPResponse("Succesfully deleted all posts", result[0]);
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function getPost(req, res) {
  try {
    const postId = req.params.postId;
    const foundPost = await Post.getPost(postId);
    let response;
    !foundPost
      ? (response = new NotFoundResponse(undefined, `Post ${postId} not found`))
      : (response = new OKHTTPResponse(undefined, { foundPost }));
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function getPostAndAuthorDetail(req, res) {
  try {
    const postId = req.params.postId;
    const foundPost = await Post.getPostAndAuthorDetail(postId);
    let response;
    !foundPost
      ? (response = new NotFoundResponse(undefined, `Post ${postId} not found`))
      : (response = new OKHTTPResponse(undefined, { foundPost }));
    res.status(response.statusCode).json(response);
  } catch {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function updatePost(req, res) {
  try {
    const postId = req.params.postId;
    let response;
    //Check if post exists
    const foundPost = await Post.getPost(postId);
    if (!foundPost) {
      response = new NotFoundResponse(undefined, `Post ${postId} not found`);
      return res.status(response.statusCode).json(response);
    }
    //Check if loggedInUser own the post
    if (foundPost.userId != req.loggedInId) {
      response = ForbiddenResponse.withMessage("User can not modify post belongs to a different user.");
      return res.status(response.statusCode).json(response);
    }
    const formData = { title: req.body.title, content: req.body.content };
    const result = await Post.updatePost(postId, formData);
    response = new OKHTTPResponse("Successfully updated a post", result);
    return res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function deletePost(req, res) {
  try {
    const postId = req.params.postId;
    //Check if loggedin user is author of post
    const foundPost = await Post.getPost(postId);
    if (!foundPost) {
      const response = new NotFoundResponse(undefined, `Post ${postId} not found`);
      return res.status(response.statusCode).json(response);
    }
    //Check if loggedInUser own the post
    if (foundPost.userId != req.loggedInId) {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        statusCode: StatusCodes.METHOD_NOT_ALLOWED,
        data: {
          name: ReasonPhrases.METHOD_NOT_ALLOWED,
          message: "User can not delete post belongs to a different user.",
        },
      });
    }
    const result = await Post.deletePost(postId);
    const response = new OKHTTPResponse("Successfully deleted a post", result);
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}
