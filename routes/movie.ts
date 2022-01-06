import { NextFunction, Request, Response } from "express";

import express from "express";
const router = express.Router();

import { scrapeThumbnails } from "../util/recommendation_engine";
import { getMovies } from "../util/database_functions/movie";
import { MovieFilterParameters, PageOptions } from "../types";
import { recommendations_for_movie_content } from "../db_functions";

router.get(
  "/:id/recommend",
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id = parseInt(req.params.id);
    console.log(user_id);
    try {
      const rec = await recommendations_for_movie_content(user_id, {});
      await scrapeThumbnails(rec);

      res.status(200).json({ movies: rec });
    } catch (error) {
      console.log(error);
      res.status(400).json({ status: "failed" });
    }
  }
);

module.exports = router;
