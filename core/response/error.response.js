"use strict";

const {
  ReasonPhrases,
  StatusCodes,
} = require("../errorConstant/httpStatusCode");

class ErrorResponse extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    
  }
}
// code 400
class ConflictRequestError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.CONFLICT,
    statusCode = StatusCodes.CONFLICT
  ) {
    super(message, statusCode);
  }
}
class BadRequestError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.BAD_REQUEST,
    statusCode = StatusCodes.BAD_REQUEST
  ) {
    super(message, statusCode);
  }
}
class UnauthorizedError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.UNAUTHORIZED,
    statusCode = StatusCodes.UNAUTHORIZED
  ) {
    super(message, statusCode);
  }
}
class NotFoundError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.NOT_FOUND,
    statusCode = StatusCodes.NOT_FOUND
  ) {
    super(message, statusCode);
  }
}
class ForbiddenError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.FORBIDDEN,
    statusCode = StatusCodes.FORBIDDEN
  ) {
    super(message, statusCode);
  }
}
class MethodNotAllowedError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.METHOD_NOT_ALLOWED,
    statusCode = StatusCodes.METHOD_NOT_ALLOWED
  ) {
    super(message, statusCode);
  }
}
//code 422
class UnprocessableEntityError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.UNPROCESSABLE_ENTITY,
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY
  ) {
    super(message, statusCode);
  }
}
// code 500

class InternalServerError extends ErrorResponse {
  constructor(
    message = ReasonPhrases.INTERNAL_SERVER_ERROR,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    super(message, statusCode);
  }
}
class NotImplemented extends ErrorResponse {
  constructor(
    message = ReasonPhrases.NOT_IMPLEMENTED,
    statusCode = StatusCodes.NOT_IMPLEMENTED
  ) {
    super(message, statusCode);
  }
}
class BadGateway extends ErrorResponse {
  constructor(
    message = ReasonPhrases.BAD_GATEWAY,
    statusCode = StatusCodes.BAD_GATEWAY
  ) {
    super(message, statusCode);
  }
}
class ServiceUnavailable extends ErrorResponse {
  constructor(
    message = ReasonPhrases.SERVICE_UNAVAILABLE,
    statusCode = StatusCodes.SERVICE_UNAVAILABLE
  ) {
    super(message, statusCode);
  }
}
class GatewayTimeout extends ErrorResponse {
  constructor(
    message = ReasonPhrases.GATEWAY_TIMEOUT,
    statusCode = StatusCodes.GATEWAY_TIMEOUT
  ) {
    super(message, statusCode);
  }
}

module.exports = {
  BadRequestError,
  ConflictRequestError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  MethodNotAllowedError,
  InternalServerError,
  NotImplemented,
  BadGateway,
  ServiceUnavailable,
  GatewayTimeout,
  UnprocessableEntityError,
};
