import User from "../models/user.js";
import Post from "../models/post.js";
import Privilege from "../models/privilege.js";
import UserInfo from "../models/userInfo.js";
import {
  AccountNotFoundResponse,
  BadRequestResponse,
  ForbiddenResponse,
  generateErrorResponse,
  NotFoundResponse,
  SessionExpiredErrorResponse,
  UnauthorizedResponse,
} from "../utils/error.js";
import { OKHTTPResponse } from "../utils/response.js";
import SignUpUserSchema from "../schemas/user/SignUpUser.js";
import LoginUserSchema from "../schemas/user/LoginUserSchema.js";
import ChangePasswordSchema from "../schemas/user/ChangePasswordSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import fs from "fs";
import _ from "lodash";
import sharp from "sharp";

import Cloudinary from "../middleware/cloudinary.js";

import * as path from "path";
import { fileURLToPath } from "url";
import EditUserInfoSchema from "../schemas/user/EditUserInfoSchema.js";
import client from "../connection/redis.js";
import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";
const fileName = path.basename(fileURLToPath(import.meta.url)).slice(0, -3);

async function generateToken(userId, userRole) {
  const userPrivileges = await Privilege.getPrivileges(userRole);
  const payload = { id: userId, privileges: {} };
  userPrivileges.forEach((privilege) => {
    const name = privilege.route;
    if (!_.has(payload.privileges, name)) {
      payload.privileges[name] = [privilege.action];
    } else {
      payload.privileges[name].push(privilege.action);
    }
  });
  const token = jwt.sign(payload, process.env.JWT_SECRET || "This is a bad secret", { expiresIn: 20 * 60 });
  return token;
}

export async function getAllUsers(req, res) {
  try {
    const foundUsers = await User.getAllUsers();
    let response = {};
    !foundUsers.length
      ? (response = new NotFoundResponse(undefined, "Users are not found"))
      : (response = new OKHTTPResponse(undefined, { foundUsers }));
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function signupUser(req, res) {
  try {
    const { email, password, username, firstname, lastname, birthdate } = req.body;
    let imageFile = req.file;
    let imageFileBuffer;
    // Check if image buffer exists
    if (_.has(imageFile, "buffer")) imageFileBuffer = req.file.buffer;
    else imageFileBuffer = fs.readFileSync("./resources/images/default.jpg");
    const imageBuffer = await sharp(imageFileBuffer).resize({ width: 320, height: 320, fit: "cover" }).toBuffer();
    let validatedData = await SignUpUserSchema.validateAsync({
      email,
      password,
      username,
      firstname,
      lastname,
      birthdate,
    });
    let response;
    const userId = await User.createUser({
      email: validatedData.email,
      password: validatedData.password,
    });

    fs.writeFileSync(`./resources/images/${userId}.jpg`, imageBuffer, { flag: "w+" });
    await Cloudinary.uploader
      .upload(`./resources/images/${userId}.jpg`, {
        folder: "/social/users/profileImage",
        public_id: userId,
      })
      .then(async (responseData) => {
        if (responseData) {
          await UserInfo.createUserInfo({
            userId,
            username,
            firstname,
            lastname,
            birthdate,
            profileImageUrl: responseData.secure_url,
          });
          response = new OKHTTPResponse("Successfully sign up a new user", undefined);
        }
      })
      .catch((err) => {
        throw err;
      });
    res.status(response.statusCode).json(response);
  } catch (err) {
    let response;
    if (err.name === "ValidationError") {
      const message = [];
      err.details.forEach((detail) => {
        message.push(detail.message);
      });
      response = new BadRequestResponse(err.name, message);
    } else {
      response = generateErrorResponse(fileName, err);
    }
    res.status(response.statusCode).json(response);
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const validatedData = await LoginUserSchema.validateAsync({ email, password });
    const foundAccount = await User.getUserByEmail(validatedData.email);
    if (!foundAccount) {
      throw AccountNotFoundResponse;
    } else {
      const match = await bcrypt.compare(password, foundAccount.passwordHash);
      if (!match) {
        throw AccountNotFoundResponse;
      } else {
        const token = await generateToken(foundAccount.id, foundAccount.role);
        await client.set(foundAccount.id, token, { EX: 20 * 60 });
        const response = new OKHTTPResponse("Successfully login user", { token });
        res.status(response.statusCode).json(response);
      }
    }
  } catch (err) {
    let response;
    // If there is an error with validation, create a new error related message and return to controller
    if (err.name === "ValidationError") {
      const message = [];
      err.details.forEach((detail) => {
        message.push(detail.message);
      });
      response = new BadRequestResponse(err.name, message);
    } else {
      response = generateErrorResponse(fileName, err);
    }
    res.status(response.statusCode).json(response);
  }
}

export async function logoutUser(req, res) {
  try {
    const userId = req.loggedInId;
    const redisToken = await client.get(userId);

    if (redisToken == null) return res.status(StatusCodes.OK).json({ message: "User was not logged in." });
    else {
      await client.del(userId);
      return res.status(StatusCodes.OK).json({ message: "User logged out." });
    }
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export function deleteAllUser(req, res) {
  res.send("Deleting all users");
}

export async function getUserInfo(req, res) {
  try {
    const userId = req.params.userId;
    const foundUserInfo = await UserInfo.getUserInfo(userId);
    let response = {};
    foundUserInfo == null
      ? (response = new NotFoundResponse(undefined, `User with id ${userId} not found`))
      : (response = new OKHTTPResponse(undefined, { foundUserInfo }));
    res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function editUserPassword(req, res) {
  try {
    const { oldPassword, newPassword, newPassword2 } = req.body;
    const validatedData = await ChangePasswordSchema.validateAsync({ oldPassword, newPassword, newPassword2 });
    const sessionUserId = req.loggedInId;
    const paramUserId = req.params.userId;
    let response;
    // Check if jwt token id is the same as parameter id
    if (sessionUserId !== paramUserId) {
      response = new ForbiddenResponse(undefined, "Userid from session and userid from path parameter does not match");
    } else {
      // Check if new password and the confirming password are the same
      if (validatedData.newPassword !== validatedData.newPassword2) {
        response = new BadRequestResponse(undefined, "New password and confirming password does not match.");
      } else {
        // Check if user with provided id exist
        const foundAccount = await User.getUserById(sessionUserId);
        if (!foundAccount) {
          response = new NotFoundResponse(undefined, `User with id ${sessionUserId} not found`);
        } else {
          // Check if user original account match form input
          const match = bcrypt.compareSync(validatedData.oldPassword, foundAccount.passwordHash);
          if (!match) {
            response = new UnauthorizedResponse(undefined, "Current password does not match");
          } else {
            const passwordHash = await bcrypt.hash(validatedData.newPassword, 10);
            const result = await User.editUserPassword({ sessionUserId, passwordHash });
            response = new OKHTTPResponse("Successfully changed user password", result);
          }
        }
      }
    }
    res.status(response.statusCode).json(response);
  } catch (err) {
    let response;
    if (err.name === "ValidationError") {
      const message = [];
      err.details.forEach((detail) => {
        message.push(detail.message);
      });
      response = new BadRequestResponse(err.name, message);
    } else {
      response = generateErrorResponse(fileName, err);
    }
    res.status(response.statusCode).json(response);
  }
}

export async function editUserInfo(req, res) {
  try {
    const { username, firstname, lastname, birthdate } = req.body;
    const validatedData = await EditUserInfoSchema.validateAsync({ username, firstname, lastname, birthdate });
    const imageFile = req.file;
    let imageFileBuffer;
    // Check if image buffer exists
    if (_.has(imageFile, "buffer")) imageFileBuffer = req.file.buffer;
    else imageFileBuffer = fs.readFileSync("./resources/images/default.jpg");
    const imageBuffer = await sharp(imageFileBuffer).resize({ width: 320, height: 320, fit: "cover" }).toBuffer();
    const sessionUserId = req.loggedInId;
    const paramUserId = req.params.userId;
    let response;
    if (sessionUserId !== paramUserId) {
      response = ForbiddenResponse.withMessage("Userid from session and userid from path parameter does not match");
    }

    const foundUser = await User.getUserById(sessionUserId);
    if (!foundUser) {
      response = new NotFoundResponse();
      response = NotFoundResponse.withMessage(`User with ${sessionUserId} not found.`);
    }

    fs.writeFileSync(`./resources/images/${sessionUserId}.jpg`, imageBuffer, { flag: "w+" });
    await Cloudinary.uploader
      .upload(`./resources/images/${sessionUserId}.jpg`, {
        folder: "/social/users/profileImage",
        public_id: sessionUserId,
      })
      .then(async (responseData) => {
        if (responseData) {
          const result = await UserInfo.updateUserInfo({
            sessionUserId,
            username: validatedData.username,
            firstname: validatedData.firstname,
            lastname: validatedData.lastname,
            birthdate: validatedData.birthdate,
            profileImageUrl: responseData.secure_url,
          });
          response = new OKHTTPResponse("Successfully changed user info", result);
        }
      })
      .catch((err) => {
        throw err;
      });
    return res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function deleteUser(req, res) {
  try {
    let response;
    const sessionUserId = req.loggedInId;
    const paramUserId = req.params.userId;
    if (sessionUserId !== paramUserId) {
      response = new ForbiddenResponse();
      response = ForbiddenResponse.withMessage("Userid from session and userid from path parameter does not match");
    }

    const foundAccount = await User.getUserById(sessionUserId);
    if (!foundAccount) {
      response = new NotFoundResponse();
      response = NotFoundResponse.withMessage(`User with ${sessionUserId} not found.`);
    }

    const result1 = await Post.deletePostByUserId(sessionUserId);
    const result2 = await UserInfo.deleteUserInfo(sessionUserId);
    const result3 = await User.deleteUser(sessionUserId);
    await client.del(sessionUserId);
    response = new OKHTTPResponse("Successfully delete user", [result1, result2, result3]);

    await Cloudinary.uploader
      .destroy(`social/users/profileImage/${sessionUserId}`)
      .then(
        fs.unlink(`./resources/images/${sessionUserId}.jpg`, (err) => {
          if (err) throw err;
        })
      )
      .catch((err) => {
        console.log(err);
        throw err;
      });

    return res.status(response.statusCode).json(response);
  } catch (err) {
    const response = generateErrorResponse(fileName, err);
    res.status(response.statusCode).json(response);
  }
}

export async function validateToken(req, res) {
  try {
    const token = req.body.jwt_token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const redisToken = await client.get(decoded.id);
    if (redisToken === null) throw new NotFoundResponse(null, "Token does not exist in Redis database");
    if (redisToken !== token) throw new UnauthorizedResponse(null, "Session token and database token does not match");

    let response;
    const remainExpiresMinutes = (decoded.exp * 1000 - Date.now()) / (60 * 1000);
    if (remainExpiresMinutes < 5) {
      const foundUserRole = await User.getRoleById(decoded.id);
      const token = await generateToken(decoded.id, foundUserRole.role);
      await client.set(decoded.id, token, { EX: 20 * 60 });
      response = new OKHTTPResponse("User token refreshed", { token });
    } else {
      response = new OKHTTPResponse("User token validated", undefined);
    }
    res.status(response.statusCode).json(response);
  } catch (err) {
    let response;
    if (err.name === "TokenExpiredError") {
      response = new SessionExpiredErrorResponse(undefined, "JWT token has expired, please login again");
    } else {
      response = generateErrorResponse(fileName, err);
    }
    res.status(response.statusCode).json(response);
  }
}
