import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { SessionExpiredErrorResponse } from "../utils/error.js";

const authenticateJWT = async (req, res, next) => {
  try {
    const bearerHeader = req.headers["authorization"];
    if (typeof bearerHeader !== "undefined") {
      const token = bearerHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.loggedInId = decoded.id;
      next();
    } else {
      res.status(StatusCodes.UNAUTHORIZED).response({ message: "JWT token is not provided." });
    }
  } catch (err) {
    console.log(err);
    if (err.name === "TokenExpiredError") {
      const response = new SessionExpiredErrorResponse(undefined, "JWT token has expired, please login again");
      res.status(response.statusCode).json(response);
    }
  }
};

export default authenticateJWT;
