import express from "express";
import jwt from "jsonwebtoken";
import client from "../connection/redis.js";
import _ from "lodash";
import { BadRequestResponse, UnauthorizedResponse } from "../utils/error.js";
// import { pathToRegexp } from "path-to-regexp";

const checkPrivilege = async (req, res, next) => {
  try {
    const redisToken = await client.get(req.loggedInId);
    const payload = jwt.decode(redisToken);
    const wildCardPath = req.baseUrl.slice(1) + req.route.path;

    console.log(payload.privileges);
    console.log(`${req.method} - ${wildCardPath}`);

    const privilege = _.values(_.pick(payload.privileges, wildCardPath))[0];

    let response;

    if (privilege == null) {
      response = new UnauthorizedResponse(
        "Unauthorized user",
        `This user can not access resource on path ${wildCardPath}`
      );
      return res.status(response.statusCode).json(response);
    }
    if (!privilege.includes(req.method)) {
      response = new UnauthorizedResponse(
        "Unauthorized user",
        `This user can not access resource on path ${wildCardPath} with method ${req.method}`
      );
      return res.status(response.statusCode).json(response);
    }
    next();
  } catch (err) {
    console.log(err);
  }
};

export default checkPrivilege;
