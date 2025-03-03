"use strict";

const {
  ReasonPhrases,
  StatusCodes,
} = require("../errorConstant/httpStatusCode");

class SuccessResponse {
  constructor({
    message,
    statusCode = StatusCodes.OK,
    reasonStatusCode = ReasonPhrases.OK,
    metadata = {},
  }) {
    this.message = !message ? reasonStatusCode : message;
    this.statusCode = statusCode;
    this.metadata = metadata;
  }
  send(res, headers = {}) {
    return res.status(this.statusCode).json(this);
  }
}

class OK extends SuccessResponse {
  constructor({ message, metadata }) {
    super({ message, metadata });
  }
}
class CREATED extends SuccessResponse {
  constructor({
    message,
    statusCode = StatusCodes.CREATED,
    reasonStatusCode = ReasonPhrases.CREATED,
    metadata,
  }) {
    super({ message, statusCode, reasonStatusCode, metadata });
  }
}
class ACCEPTED extends SuccessResponse {
  constructor({
    message,
    statusCode = StatusCodes.ACCEPTED,
    reasonStatusCode = ReasonPhrases.ACCEPTED,
    metadata,
  }) {
    super({ message, statusCode, reasonStatusCode, metadata });
  }
}
class NO_CONTENT extends SuccessResponse {
  constructor({
    message,
    statusCode = StatusCodes.NO_CONTENT,
    reasonStatusCode = ReasonPhrases.NO_CONTENT,
    metadata,
  }) {
    super({ message, statusCode, reasonStatusCode, metadata });
  }
}
class RESET_CONTENT extends SuccessResponse {
  constructor({
    message,
    statusCode = StatusCodes.RESET_CONTENT,
    reasonStatusCode = ReasonPhrases.RESET_CONTENT,
    metadata,
  }) {
    super({ message, statusCode, reasonStatusCode, metadata });
  }
}

module.exports = {
  OK,
  CREATED,
  ACCEPTED,
  NO_CONTENT,
  RESET_CONTENT,
};
