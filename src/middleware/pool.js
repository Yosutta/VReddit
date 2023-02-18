import * as dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  connectionLimit: 5,
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.PORT || "3306",
  user: process.env.USER || "root",
  password: process.env.PASSWORD || "password",
  typeCast: function castField(field, useDefaultTypeCasting) {
    if (field.type === "BIT" && field.length === 1) {
      var bytes = field.buffer();
      return bytes[0] === 1;
    }
    return useDefaultTypeCasting();
  },
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

export async function createDatabase(dbname) {
  try {
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${dbname}`);
    const connection = await pool.getConnection();
    connection.changeUser({ database: "social" });
    connection.release();
  } catch (err) {
    console.log(err);
  }
}

export async function createTables() {
  try {
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
      userId varchar(36) NOT NULL,
      CONSTRAINT FK_posts_users FOREIGN KEY (userId) REFERENCES users(id)
    );`;
    await pool.query(social_posts);

    const social_usersInfo = `
    CREATE TABLE IF NOT EXISTS usersInfo (
      userId varchar(36) NOT NULL UNIQUE,
      username varchar(32) NOT NULL,
      firstname varchar(16) NOT NULL,
      lastname varchar(16) NOT NULL,
      birthdate varchar(64) NOT NULL,
      profileImageUrl varchar(2048) NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT FK_usersInfo_users FOREIGN KEY (userId) REFERENCES users(id)
    );`;
    await pool.query(social_usersInfo);

    const social_privileges = `
    CREATE TABLE IF NOT EXISTS privileges(
      id INT PRIMARY KEY AUTO_INCREMENT,
      route VARCHAR(32),
      action VARCHAR(8)
    );`;
    await pool.query(social_privileges);

    const social_role_privileges = `
    CREATE TABLE IF NOT EXISTS rolePrivileges(
      id INT PRIMARY KEY AUTO_INCREMENT,
      roleName VARCHAR(16),
      privilegeId INT,
      CONSTRAINT FK_rolePrivileges_privileges FOREIGN KEY (privilegeId) REFERENCES privileges(id)
    );`;
    await pool.query(social_role_privileges);

    const social_posts_comments = `
    CREATE TABLE IF NOT EXISTS postsComments (
      id varchar(36) PRIMARY KEY,
      postId varchar(36) NOT NULL,
      parentId varchar(36) DEFAULT NULL,
      userId varchar(36) NOT NULL,
      commentText varchar(256) NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      edited bit DEFAULT 0,
      replyCount int DEFAULT 0,
      CONSTRAINT FK_postsComments_posts FOREIGN KEY (postId) REFERENCES posts(id),
      CONSTRAINT SR_FK_postsComments_parentId FOREIGN KEY (parentId) REFERENCES postsComments(id),
      CONSTRAINT FK_postsComments_usersInfo FOREIGN KEY (userId) REFERENCES usersInfo(userId)
    );`;
    await pool.query(social_posts_comments);

    const social_posts_comment_ratings = `
    CREATE TABLE IF NOT EXISTS postsCommentRatings(
      postId varchar(36) NOT NULL,
      commentId varchar(36),
      userId varchar(36) NOT NULL,
      rating bit NOT NULL,
      CONSTRAINT FK_postsCommentRatings_posts FOREIGN KEY (postId) REFERENCES posts(id),
      CONSTRAINT FK_postsCommentRatings_postsComments FOREIGN KEY (commentId) REFERENCES postsComments(id),
      CONSTRAINT FK_postsCommentRatings_usersInfo FOREIGN KEY (userId) REFERENCES usersinfo(userId)
    );`;
    await pool.query(social_posts_comment_ratings);
  } catch (err) {
    console.log(err);
  }
}

export async function populateTable() {
  const privilegesRows = await pool.query("SELECT * FROM privileges");
  if (privilegesRows[0].length === 0) {
    const populate_privileges = `INSERT INTO privileges (route, action) values
    ("posts/", "GET"), ("posts/", "POST"), ("posts/", "DELETE"),
    ("posts/:postId", "GET"), ("posts/:postId", "PUT"), ("posts/:postId", "DELETE"),
    ("users/", "GET"), ("users/", "POST"), ("users/", "DELETE"),
    ("users/:userId", "GET"), ("users/:userId", "PUT"), ("users/:userId", "DELETE"),
    ("comments/", "GET"), ("comments/", "POST"),
    ("comments/:commentId", "PUT"), ("comments/:commentId", "DELETE"),
    ("comments/:parentId", "GET");`;
    await pool.query(populate_privileges);
  }

  const rolePrivilegesRows = await pool.query("SELECT * FROM rolePrivileges");
  if (rolePrivilegesRows[0].length === 0) {
    const populate_rolePriveleges = `
      INSERT INTO rolePrivileges (roleName, privilegeId)
      values ("user", 1), ("user", 2), ("user", 4), ("user", 5), ("user", 6), ("user", 7), ("user", 10), ("user", 11), ("user", 12), ("user", 13), ("user", 14), ("user", 15), ("user", 16), ("user", 17),
      ("admin", 1), ("admin", 2), ("admin", 3), ("admin", 4), ("admin", 5), ("admin", 6), ("admin", 7), ("admin", 8), ("admin", 10), ("admin", 11), ("admin", 12), ("admin", 13), ("admin", 14), ("admin", 15), ("admin", 16), ("admin", 17);`;
    await pool.query(populate_rolePriveleges);
  }
}

await createDatabase("social");
await createTables();
// populateTable();

export default pool;
