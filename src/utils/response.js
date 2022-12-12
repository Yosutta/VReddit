import { ReasonPhrases, StatusCodes } from "http-status-codes";

export class OKHTTPResponse {
  constructor(message = ReasonPhrases.OK, data) {
    this.statusCode = StatusCodes.OK;
    this.message = message;
    this.data = data;
  }

  static onlyMessage(message) {
    return OKHTTPResponse(message, null);
  }
}
