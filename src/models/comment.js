import pool from "../middleware/pool.js";
import CreateCommentSchema from "../schemas/comment/CreateCommentSchema.js";
import _ from "lodash";
import crypto from "crypto";

export default {
  async getParentCommentsByPostId(postId) {
    try {
      // const QUERYSTRING = "SELECT * FROM posts ORDER BY createdAt DESC";
      const QUERYSTRING = `
      SELECT id as commentId, postId, parentId, postscomments.commentText, postscomments.createdAt, postscomments.replyCount,
      usersinfo.userId, usersinfo.username, usersinfo.profileImageUrl
      FROM social.postscomments 
      INNER JOIN social.usersinfo ON social.usersinfo.userId = social.postscomments.userId
      WHERE postId="b61c8598abd0c4c15fdfe6021094b06c" AND parentId IS NULL;`;
      const [rows, fields] = await pool.query(QUERYSTRING, [postId]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async getChildCommentsByParentId(postId, parentId) {
    try {
      // const QUERYSTRING = "SELECT * FROM posts ORDER BY createdAt DESC";d
      const QUERYSTRING = `
      SELECT id as commentId, postId, parentId, postscomments.commentText, postscomments.createdAt,
      usersinfo.userId, usersinfo.username, usersinfo.profileImageUrl
      FROM social.postscomments 
      INNER JOIN social.usersinfo ON social.usersinfo.userId = social.postscomments.userId
      WHERE (postId=? AND parentId=?) OR (id=?)
      ORDER BY createdAt ASC; 
      `;
      const [rows, fields] = await pool.query(QUERYSTRING, [postId, parentId, parentId]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async getCommentById(commentId) {
    try {
      // const QUERYSTRING = "SELECT * FROM posts ORDER BY createdAt DESC";
      const QUERYSTRING = `
      SELECT * from social.postscomments WHERE id = ?
      `;
      const [rows, fields] = await pool.query(QUERYSTRING, [commentId]);
      return rows[0];
      // return `Getting comment by postId ${postId}`;
    } catch (err) {
      throw err;
    }
  },

  async createCommentOnPostId(postId, parentId, userId, formData) {
    try {
      const validated = await CreateCommentSchema.validateAsync(formData);
      const uuid = crypto.randomBytes(16).toString("hex");
      const values = _.values(validated);
      let QUERYSTRING = `INSERT INTO social.postscomments (id, postId, parentId, userId, commentText) VALUES ( ?, ?, ?, ?, `;
      values.map((value, INDEX, arr) => {
        INDEX === arr.length - 1 ? (QUERYSTRING += `? ) `) : (QUERYSTRING += `?, `);
      });
      const [rows, fields] = await pool.query(QUERYSTRING, [uuid, postId, parentId, userId, ...values]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async updateInitialCommentReplyCount(parentId) {
    try {
      let QUERYSTRING = `
      UPDATE postscomments
      SET replyCount = (SELECT COUNT(id) from (SELECT * FROM postscomments) as b WHERE parentId=?)
      WHERE id=?;
        `;
      const [rows, fields] = await pool.query(QUERYSTRING, [parentId, parentId]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async editCommentById(commentId, commentText) {
    try {
      const QUERYSTRING = `
      UPDATE postscomments SET commentText=?, edited=TRUE where id=?
      `;
      const [rows, fields] = await pool.query(QUERYSTRING, [commentText, commentId]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async deleteCommentById(commentId) {
    try {
      // const QUERYSTRING = "SELECT * FROM posts ORDER BY createdAt DESC";
      const QUERYSTRING = `
      DELETE FROM postscomments WHERE id=?;
        `;
      const [rows, fields] = await pool.query(QUERYSTRING, [commentId]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async deleteCommentByParentId(parentId) {
    try {
      const QUERYSTRING = `
      DELETE FROM postscomments WHERE parentId=?;
        `;
      const [rows, fields] = await pool.query(QUERYSTRING, [parentId]);
      return rows;
    } catch (err) {
      throw err;
    }
  },
};
