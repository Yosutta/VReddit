import * as dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";
import fs from "fs";

const pool = mysql.createPool({
  connectionLimit: 5,
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.PORT || "3306",
  user: process.env.USER || "root",
  password: process.env.PASSWORD || "password",
});

// pool.query("CREATE DATABASE IF NOT EXISTS social", (err, result) => {
//   if (err) {
//     console.log(err);
//   } else {
//     pool.getConnection((err, connection) => {
//       if (err) {
//         console.log(err);
//       } else {
//         connection.changeUser({ database: "social" });
//       }
//     });
//   }
// });

async function attemptConnection() {
  try {
    await pool.query("CREATE DATABASE IF NOT EXISTS social");
    const connection = await pool.getConnection();
    connection.changeUser({ database: "social" });
    connection.release();

    const social_users = `
    CREATE TABLE IF NOT EXISTS users (
      id varchar(36) NOT NULL primary key,
      email varchar(64) NOT NULL UNIQUE,
      passwordHash nvarchar(128) NOT NULL,
      role varchar(10) NOT NULL
    );`;
    await pool.query(social_users);

    const social_posts = `
    CREATE TABLE IF NOT EXISTS posts (
      id varchar(36) NOT NULL primary key,
      title nvarchar(128) NOT NULL,
      content nvarchar(1024) NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      userId varchar(36) NOT NULL UNIQUE
    );`;
    await pool.query(social_posts);
    const social_posts_constraints = `ALTER table posts ADD FOREIGN KEY (userId) REFERENCES users(id);`;
    await pool.query(social_posts_constraints);

    const social_usersInfo = `
    CREATE TABLE IF NOT EXISTS usersInfo (
      userId varchar(36) NOT NULL UNIQUE,
      username varchar(32) NOT NULL,
      firstname varchar(32) NOT NULL,
      lastname varchar(32) NOT NULL,
      birthdate varchar(64) NOT NULL,
      profileImageUrl varchar(2048) NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`;
    await pool.query(social_usersInfo);
    const social_usersInfo_constraints = `ALTER table usersInfo ADD FOREIGN KEY (userId) REFERENCES users(id);`;
    await pool.query(social_usersInfo_constraints);

    const social_privileges = `
    CREATE TABLE IF NOT EXISTS privileges(
      id INT PRIMARY KEY AUTO_INCREMENT,
      route VARCHAR(16),
      action VARCHAR(8)
    );`;
    await pool.query(social_privileges);

    const social_role_privileges = `
    CREATE TABLE IF NOT EXISTS rolePrivileges(
      id INT PRIMARY KEY AUTO_INCREMENT,
      roleName VARCHAR(16),
      privilegeId INT
    );`;
    await pool.query(social_role_privileges);

    const social_role_privileges_constraints = `
    ALTER TABLE rolePrivileges
    ADD FOREIGN KEY (privilegeId) REFERENCES privileges(id);`;
    await pool.query(social_role_privileges_constraints);

    // const populate_privileges = `INSERT INTO privileges (route, action) values
    //     ("posts", "GET"), ("posts", "POST"), ("posts", "DELETE"),
    //     ("posts/:postId", "GET"), ("posts/:postId", "PUT"), ("posts/:postId", "DELETE"),
    //     ("users", "GET"), ("users", "POST"), ("users", "DELETE"),
    //     ("users/:userId", "GET"), ("users/:userId", "PUT"), ("users/:userId", "DELETE");`;
    // await pool.query(populate_privileges);

    // const populate_rolePriveleges = `
    // INSERT INTO rolePrivileges (roleName, privilegeId)
    // values ("user", 1), ("user", 2), ("user", 4), ("user", 5), ("user", 6), ("user", 10), ("user", 11), ("user", 12),
    // ("admin", 1), ("admin", 2), ("admin", 3), ("admin", 4), ("admin", 5), ("admin", 6), ("admin", 7), ("admin", 8), ("admin", 10), ("admin", 11), ("admin", 12);`;
    // await pool.query(populate_rolePriveleges);
  } catch (err) {
    console.log(err);
  }
}

attemptConnection();

export default pool;
