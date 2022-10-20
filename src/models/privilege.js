import pool from "../middleware/pool.js";

export default {
  async getPrivileges(role) {
    try {
      const QUERYSTRING =
        "SELECT rolename, route, action FROM rolePrivileges INNER JOIN privileges ON rolePrivileges.privilegeId = privileges.id WHERE roleName=? ";
      const [rows, fields] = await pool.query(QUERYSTRING, [role]);
      return rows;
    } catch (err) {
      throw err;
    }
  },
};
