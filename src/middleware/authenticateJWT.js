import jwt from "jsonwebtoken";
import client from "../connection/redis.js";
import { ForbiddenResponse, SessionExpiredErrorResponse, UnauthorizedResponse } from "../utils/error.js";
import logger from "../utils/logger.js";

import * as path from "path";
import { fileURLToPath } from "url";
const fileName = path.basename(fileURLToPath(import.meta.url)).slice(0, -3);

const authenticateJWT = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    // if (typeof bearerHeader !== "undefined") {
    //   const token = bearerHeader.split(" ")[1];
    //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //   const redisToken = await client.get(decoded.id);
    //   if (!redisToken) {
    //     let response = new UnauthorizedResponse();
    //     response = UnauthorizedResponse.withMessage("Not logged in.");
    //     return res.status(response.statusCode).json(response);
    //   }
    //   req.loggedInId = decoded.id;
    //   next();
    // } else {
    //   let response = new ForbiddenResponse();
    //   response = ForbiddenResponse.withMessage("Not logged in.");
    //   res.status(response.statusCode).json(response);
    // }

    if (typeof bearerHeader == "undefined") {
      let response = new ForbiddenResponse();
      response = ForbiddenResponse.withMessage("Not logged in.");
      return res.status(response.statusCode).json(response);
    } else {
      const token = bearerHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const redisToken = await client.get(decoded.id);
      if (!redisToken) {
        let response = new UnauthorizedResponse();
        response = UnauthorizedResponse.withMessage("User have already logged out.");
        return res.status(response.statusCode).json(response);
      }
      req.loggedInId = decoded.id;
      next();
    }
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      logger.info(fileName, err);
      const response = new SessionExpiredErrorResponse(undefined, "JWT token has expired, please login again");
      res.status(response.statusCode).json(response);
    } else if (err.name === "JsonWebTokenError") {
      logger.warn(fileName, err);
      const response = new SessionExpiredErrorResponse(undefined, "Invalid signature - JWT, please login again");
      res.status(response.statusCode).json(response);
    } else {
      const response = generateErrorResponse(fileName, err);
      res.status(response.statusCode).json(response);
    }
  }
};

export default authenticateJWT;

// retrieve jwt from user
// check if jwt exists
// check if jwt is valid
// check if jwt is in redis storage
