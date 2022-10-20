import _ from "lodash";
import crypto from "crypto";
import pool from "../middleware/pool.js";
import SignUpUserSchema from "../schemas/user/SignUpUser.js";
import LoginUserSchema from "../schemas/user/LoginUserSchema.js";
import bcrypt from "bcrypt";
import { BadRequestResponse, NotFoundResponse } from "../utils/error.js";

export default {
  async getAllUsers() {
    try {
      const QUERYSTRING = "SELECT * FROM users";
      const [rows, fields] = await pool.query(QUERYSTRING);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async createUser(formData) {
    try {
      // Generate password salt
      const { email, password } = formData;
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const uuid = crypto.randomBytes(16).toString("hex");
      let QUERYSTRING = "INSERT INTO users (id, email, passwordHash, role) values (?,?,?,?)";
      const [rows, fields] = await pool.query(QUERYSTRING, [uuid, email, passwordHash, "user"]);
      return uuid;
    } catch (err) {
      throw err;
    }
  },

  async getUserByEmail(email) {
    try {
      const QUERYSTRING = "SELECT * FROM users WHERE email=?";
      const [rows, fields] = await pool.query(QUERYSTRING, [email]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  },

  async getUserById(userId) {
    try {
      const QUERYSTRING = "SELECT * FROM users WHERE id=?";
      const [rows, fields] = await pool.query(QUERYSTRING, [userId]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  },

  async editUserPassword(formData) {
    try {
      const { sessionUserId: userId, passwordHash } = formData;
      const QUERYSTRING = "UPDATE users set passwordHash=? WHERE id=?";
      const [row, field] = await pool.query(QUERYSTRING, [passwordHash, userId]);
      return row;
    } catch (err) {
      throw err;
    }
  },

  async deleteAllUser() {},

  async deleteUser(userId) {
    try {
      const QUERYSTRING = "DELETE FROM users WHERE id=?";
      const [row, field] = await pool.query(QUERYSTRING, [userId]);
      return row;
    } catch (err) {
      throw err;
    }
  },
};
