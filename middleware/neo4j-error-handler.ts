// https://expressjs.com/en/guide/error-handling.html

import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { Neo4jError } from "neo4j-driver";

module.exports = (
  err: ErrorRequestHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof Neo4jError) {
    if (err.message.includes("already exists with")) {
      const property = err.message.match(/`([a-z0-9]+)`/gi);
      message = [`${property.replace(/`/g, "")} already taken`];

      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message,
      });
    }
    // Neo.ClientError.Schema.ConstraintValidationFailed
    // Node(54778) with label `Test` must have the property `mustExist`
    else if (err.message.includes("must have the property")) {
      const [_, property] = err.message.match(/`([a-z0-9]+)`/gi);
      message = [`${property.replace(/`/g, "")} should not be empty`];

      return res.status(400).json({
        statusCode: 400,
        error: "Bad Request",
        message,
      });
    }
  }

  next(err);
};
