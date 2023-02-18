import pool from "../middleware/pool.js";
import _ from "lodash";

export default {
  async getUserInfo(userId) {
    try {
      const QUERYSTRING = "SELECT * from usersInfo WHERE userId=?";
      const [rows, fields] = await pool.query(QUERYSTRING, [userId]);
      return rows[0];
    } catch (err) {
      throw err;
    }
  },

  async createUserInfo(data) {
    try {
      // Seperates keys and values
      const keys = _.keys(data);
      const values = _.values(data);
      // Dynamically create a QUERYSTRING with keys and values
      let QUERYSTRING = "INSERT INTO usersInfo (";
      // keys.map((key, INDEX, arr) => {
      //   INDEX !== arr.length - 1 ? (QUERYSTRING += `${key}, `) : (QUERYSTRING += `${key}) `);
      // });
      // QUERYSTRING += "VALUES (";
      // values.map((value, INDEX, arr) => {
      //   INDEX !== arr.length - 1 ? (QUERYSTRING += `"${value}", `) : (QUERYSTRING += `"${value}") `);
      // });
      keys.map((key, INDEX, arr) => {
        INDEX !== arr.length - 1 ? (QUERYSTRING += `${key}, `) : (QUERYSTRING += `${key}) `);
      });
      QUERYSTRING += "VALUES (";
      values.map((value, INDEX, arr) => {
        INDEX !== arr.length - 1 ? (QUERYSTRING += `?, `) : (QUERYSTRING += `?) `);
      });
      const [rows, fields] = await pool.query(QUERYSTRING, [...values]);
      return rows;
    } catch (err) {
      throw err;
    }
  },

  async updateUserInfo(data) {
    try {
      // Seperates keys and values
      const userId = data.sessionUserId;
      const arr = _.omit(data, "sessionUserId");
      const KEYS = _.keys(arr);
      const VALUES = _.values(arr);
      let QUERYSTRING = "UPDATE usersInfo SET ";
      KEYS.map((key, INDEX, arr) => {
        INDEX !== arr.length - 1 ? (QUERYSTRING += `${key} = ?, `) : (QUERYSTRING += `${key} = ? `);
      });
      QUERYSTRING += "WHERE userId=?";
      const [row, field] = await pool.query(QUERYSTRING, [...VALUES, userId]);
      return row;
    } catch (err) {
      throw err;
    }
  },
  async deleteUserInfo(userId) {
    try {
      const QUERYSTRING = "DELETE FROM usersInfo WHERE userId=?";
      const [row, field] = await pool.query(QUERYSTRING, [userId]);
      return row;
    } catch (err) {
      throw err;
    }
  },
};
