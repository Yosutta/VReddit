import { jest, describe, test, expect } from "@jest/globals";
jest.setTimeout(30000);
// import app from "../app.js";
import { StatusCodes } from "http-status-codes";
// import request from "supertest";
import axios from "axios";

describe("Test the root path", () => {
  test("It should response the GET method", async (done) => {
    axios
      .get("https://api.github.com/users/Yosutta")
      .then((response) => {
        expect(response.status).toEqual(StatusCodes.OK);
        done();
      })
      .catch((err) => {
        console.log("LMAO");
      });
  });
});
