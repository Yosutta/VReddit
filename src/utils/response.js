import { StatusCodes } from "http-status-codes";

export class OKHTTPResponse {
  constructor(message = StatusCodes.OK, data) {
    this.statusCode = StatusCodes.OK;
    this.message = message;
    this.data = data;
  }
}
