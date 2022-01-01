import { NextFunction, Request, Response } from "express";

import express from "express";
const router = express.Router();
import { validationResult } from "express-validator";

import { validationParams, sort_order } from "../util/route-functions";
import { scrapeThumbnails } from "../util/recommendation_engine";
import { QueryParams } from "../types";
import {
  add_user_to_database,
  add_watched_movies_to_user,
  clear_prefs_from_user,
  clear_watched_movie_from_user,
  create_prefs_for_user,
  recommendations_for_user_collaborative,
  recommendations_for_user_content,
} from "../db_functions";
import {
  getLetterboxdUserMovies,
  isRealLetterboxdUser,
} from "../getletterboxd";

router.get(
  "/:id/update/watched",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user_id = req.params.id;
      const isReal = await isRealLetterboxdUser(user_id);
      if (isReal) {
        await add_user_to_database(user_id);

        const movie_list = await getLetterboxdUserMovies(user_id);

        try {
          // await add_doujin_to_database(id);
          await clear_watched_movie_from_user(user_id);
          console.log("cleared watch movies");

          await add_watched_movies_to_user(user_id, movie_list);
          console.log("added watched movies to user");
          await clear_prefs_from_user(user_id);
          console.log("clear prefs from user");
          await create_prefs_for_user(user_id);
          console.log("created prefs for user");
          res.status(200).json({ status: "success" });
        } catch (error) {
          console.log(error);
          res.status(400).json({ status: "failed" });
        }
      } else {
        console.log("Not a real Letterboxd user");
        res.status(400).json({ status: "failed" });
      }
    } catch (error) {
      res.status(400).json({ status: "failed" });
    }
  }
);
router.get(
  "/:id/recommend/content",
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id = req.params.id;
    console.log(user_id);
    try {
      const rec = await recommendations_for_user_content(user_id, {});
      res.status(200).json(rec);
    } catch (error) {
      console.log(error);
      res.status(400).json({ status: "failed" });
    }
  }
);
router.get(
  "/:id/recommend/collaborative",
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id = req.params.id;
    console.log(user_id);
    try {
      const rec = await recommendations_for_user_collaborative(user_id, {});
      res.status(200).json(rec);
    } catch (error) {
      console.log(error);
      res.status(400).json({ status: "failed" });
    }
  }
);
module.exports = router;
