import { NextFunction, Request, Response } from "express";

import express from "express";
const router = express.Router();

import { scrapeThumbnails } from "../util/recommendation_engine";
import { getMovies } from "../util/database_functions/movie";
import { MovieFilterParameters, PageOptions } from "../types";
import { recommendations_for_movie_content } from "../db_functions";

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  // Initialize Constants
  const filter = req.query as MovieFilterParameters;
  const options: PageOptions = {
    order_by: "vote_count",
    order_by_dir: "desc",
    page: 1,
    per_page: 100,
  };
  try {
    const movies = await getMovies(filter, options);
    await scrapeThumbnails(movies);
    res.json({ movies: movies });
  } catch (err) {
    console.log(err);
    res.json({ status: "failed" });
  }
});

module.exports = router;
