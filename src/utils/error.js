import { StatusCodes, ReasonPhrases } from "http-status-codes";

export class HTTPResponse {
  constructor(statusCode, name, message) {
    this.statusCode = statusCode;
    this.name = name;
    this.message = message;
  }
}
export class HTTPErrorResponse {
  constructor(statusCode, name, message) {
    this.statusCode = statusCode;
    this.error = {
      name: name,
      message: message,
    };
  }
}

export class NotFoundResponse {
  constructor(name, message = "") {
    this.statusCode = StatusCodes.NOT_FOUND;
    this.error = {
      name,
      message,
    };
  }

  static withMessage(message) {
    return new NotFoundResponse(ReasonPhrases.NOT_FOUND, message);
  }
}

export const AccountNotFoundResponse = new NotFoundResponse(
  undefined,
  "Account with provided email or password is not correct"
);

export class UnauthorizedResponse {
  constructor(name, message = "") {
    this.statusCode = StatusCodes.UNAUTHORIZED;
    this.error = {
      name,
      message,
    };
  }

  static withMessage(message) {
    return new UnauthorizedResponse(ReasonPhrases.UNAUTHORIZED, message);
  }
}

export class ForbiddenResponse {
  constructor(name, message = "") {
    this.statusCode = StatusCodes.FORBIDDEN;
    this.error = {
      name,
      message,
    };
  }

  static withMessage(message) {
    return new ForbiddenResponse(ReasonPhrases.FORBIDDEN, message);
  }
}

export class BadRequestResponse {
  constructor(name = ReasonPhrases.BAD_REQUEST, message = "") {
    this.statusCode = StatusCodes.BAD_REQUEST;
    this.error = {
      name,
      message,
    };
  }
}

export class InternalServerErrorResponse {
  constructor(name = ReasonPhrases.INTERNAL_SERVER_ERROR, message = "") {
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    this.error = {
      name,
      message,
    };
  }
}

export class SessionExpiredErrorResponse {
  constructor(name = "Session timeout error", message = "") {
    this.statusCode = 440;
    this.error = {
      name,
      message,
    };
  }
}

export function generateErrorResponse(fileName, err) {
  console.log(`Error caught in ${fileName} controller:\n`, err);
  let errResponse;
  !err.statusCode ? (errResponse = new InternalServerErrorResponse(undefined, err.message)) : (errResponse = err);
  return errResponse;
}
