import { NextFunction, Request, Response } from "express";
import { check, ValidationError, validationResult } from "express-validator";

export default (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: { [key: string]: string }[] = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
};
