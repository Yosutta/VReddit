import Post from "../models/post.js";
import { StatusCodes } from "http-status-codes";
import { HTTPResponse, InternalServerErrorResponse, NotFoundResponse, generateErrorResponse } from "../utils/error.js";
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
    const postId = req.params.id;
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

export async function updatePost(req, res) {
  try {
    const postId = req.params.id;
    const formData = { title: req.body.title, content: req.body.content };
    const result = await Post.updatePost(postId, formData);
    const response = new OKHTTPResponse("Successfully updated a post", result);
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function deletePost(req, res) {
  try {
    const postId = req.params.id;
    const result = await Post.deletePost(postId);
    const response = new OKHTTPResponse("Successfully deleted a post", result);
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}
