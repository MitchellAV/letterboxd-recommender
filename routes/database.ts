import { NextFunction, Request, Response } from "express";

import express from "express";
import { scrapeTMDB } from "../database";
import { set_idf_for_all_tags } from "../db_functions";
import { getLetterboxdUserMovies } from "../getletterboxd";
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
router.get(
  "/idf",

  async (req: Request, res: Response, next: NextFunction) => {
    // Initialize Constants

    try {
      await set_idf_for_all_tags();
      res.json({ status: "success" });
    } catch (err) {
      console.log(err);
    }
  }
);
router.get(
  "/letterboxd",

  async (req: Request, res: Response, next: NextFunction) => {
    // Initialize Constants

    try {
      await getLetterboxdUserMovies("test", "popular");
      res.json({ status: "success" });
    } catch (err) {
      console.log(err);
    }
  }
);
module.exports = router;
