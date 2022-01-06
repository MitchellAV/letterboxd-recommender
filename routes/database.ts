import { NextFunction, Request, Response } from "express";

import express from "express";
import { scrapeTMDB } from "../database";
const router = express.Router();
router.get(
  "/test",

  async (req: Request, res: Response, next: NextFunction) => {
    // Initialize Constants

    try {
      await scrapeTMDB();
      res.json({ status: "success" });
    } catch (err) {
      console.log(err);
    }
  }
);
export default router;
