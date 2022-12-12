import pool from "../middleware/pool.js";
import CreatePostSchema from "../schemas/post/CreatePostSchema.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import _ from "lodash";
import { BadRequestResponse, HTTPErrorResponse, NotFoundResponse } from "../utils/error.js";
import EditPostSchema from "../schemas/post/EditPostSchema.js";

export default {
  async getAllPosts() {
    try {
      // const QUERYSTRING = "SELECT * FROM posts ORDER BY createdAt DESC";
      const QUERYSTRING = `
      SELECT posts.id ,posts.title, posts.content,posts.createdAt, 
      usersinfo.username as userUsername, usersinfo.profileImageUrl as userProfileImageUrl
      FROM posts
      INNER JOIN usersinfo ON posts.userId = usersinfo.userId
      ORDER BY posts.createdAt desc
      `;
      const [rows, fields] = await pool.query(QUERYSTRING);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async createPost(formData) {
    try {
      // Validate data with Joi
      const { title, content } = formData;
      const userId = formData.userId;
      const validateData = await CreatePostSchema.validateAsync({ title, content });

      const keys = _.keys(validateData);
      keys.unshift("id");
      keys.push("userId");
      const uuid = crypto.randomBytes(16).toString("hex");
      const values = _.values(validateData);
      values.unshift(uuid);
      values.push(userId);
      // Creating QUERYSTRING with keys from validateData
      let QUERYSTRING = "INSERT INTO posts (";
      [keys].map((key, INDEX, arr) => {
        INDEX === arr.length - 1 ? (QUERYSTRING += `${key}) `) : (QUERYSTRING += `${key}, `);
      });
      // Concate QUERYSTRING with String of ?,
      QUERYSTRING += `values(${new Array(values.length + 1).join("?, ").slice(0, -2)})`;
      console.log(QUERYSTRING);

      const [rows, fields] = await pool.query(QUERYSTRING, [...values]);
      console.log(rows.sql);
      return rows;
    } catch (err) {
      const errorName = err.name;
      // If there is an error with validation, create a new error related message and return to controller
      if (errorName === "ValidationError") {
        const message = [];
        err.details.forEach((detail) => {
          message.push(detail.message);
        });
        const response = new BadRequestResponse(errorName, message);
        throw response;
      } else {
        throw err;
      }
    }
  },

  async deleteAllPosts() {
    try {
      const result = await pool.query("DELETE FROM posts");
      return result;
    } catch (err) {
      throw err;
    }
  },

  async getPost(postId) {
    try {
      // const QUERYSTRING = "SELECT * FROM posts WHERE id=?";
      const QUERYSTRING = `
      SELECT posts.id, posts.title, posts.content, posts.createdAt, posts.userId
      FROM posts
      WHERE posts.id=?;`;
      const [rows, fields] = await pool.query(QUERYSTRING, postId);
      return rows[0];
    } catch (err) {
      throw err;
    }
  },

  async updatePost(postId, formData) {
    try {
      const validateData = await EditPostSchema.validateAsync({ ...formData });
      const keys = _.keys(validateData);
      const values = _.values(validateData);
      let QUERYSTRING = "UPDATE posts SET ";
      keys.forEach((key, INDEX) => {
        INDEX === keys.length - 1 ? (QUERYSTRING += `${key}=? `) : (QUERYSTRING += `${key}=?, `);
      });
      QUERYSTRING += `WHERE id=?`;
      const [row, fields] = await pool.query(QUERYSTRING, [...values, postId]);
      if (!row.affectedRows) {
        throw new NotFoundResponse(undefined, `Post id ${postId} not found`);
      } else {
        return row;
      }
    } catch (err) {
      throw err;
    }
  },

  async deletePost(postId) {
    try {
      const QUERYSTRING = "DELETE FROM posts WHERE id=?";
      const [row, fields] = await pool.query(QUERYSTRING, [postId]);
      if (!row.affectedRows) {
        throw new NotFoundResponse(undefined, `Post id ${postId} not found`);
      } else {
        return row;
      }
    } catch (err) {
      throw err;
    }
  },
};
