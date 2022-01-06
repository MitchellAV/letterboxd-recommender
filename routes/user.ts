import { NextFunction, Request, Response } from "express";

import express from "express";
const router = express.Router();
import { validationResult } from "express-validator";

import { validationParams, sort_order } from "../util/route-functions";
import { scrapeThumbnails } from "../util/recommendation_engine";
import {
  ContentRecommendFilters,
  ContentRecommendQuery,
  QueryParams,
  RecommendMovieResponse,
} from "../types";
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

const set_query_values = (query: ContentRecommendQuery) => {
  const {
    user_tag_rating_min,
    user_tag_frequency_min,
    useUserAvgRating,
    tag_popularity_min,
    tag_popularity_max,
    ignore_tags,
    tag_labels,
    tag_department_label,
    tag_idf_min,
    tag_idf_max,
    movie_popularity_min,
    movie_popularity_max,
    movie_runtime_min,
    movie_runtime_max,
    movie_release_date_min,
    movie_release_date_max,
    movie_status,
    movie_rating_min,
    movie_rating_max,
    movie_votes_min,
    movie_votes_max,
    includeWatched,
    tagsRequired,
    tagsBlacklist,
    tagsOptional,
    order_by,
    order_by_dir,
    page,
    per_page,
  } = query;

  const default_option_number = (term: string | undefined, value: number) => {
    return term != undefined ? parseFloat(term) : value;
  };
  const default_option_boolean = (term: string | undefined, value: boolean) => {
    if (term != undefined) {
      return term == "true" ? true : false;
    } else {
      return value;
    }
  };
  const default_option_string_array = <Type>(
    term: Type | Type[] | undefined,
    value: Type[]
  ) => {
    if (term != undefined) {
      if (Array.isArray(term)) {
        return term;
      } else {
        return [term];
      }
    } else {
      return value;
    }
  };
  const default_option_string = <Type>(term: Type | undefined, value: Type) => {
    return term != undefined ? term : value;
  };

  const default_values: ContentRecommendFilters = {
    user_tag_rating_min: default_option_number(user_tag_rating_min, 0),
    user_tag_frequency_min: default_option_number(user_tag_frequency_min, 2),
    useUserAvgRating: default_option_boolean(useUserAvgRating, true),
    tag_popularity_min: default_option_number(tag_popularity_min, 0),
    tag_popularity_max: default_option_number(tag_popularity_max, -1),
    ignore_tags: default_option_string_array(ignore_tags, [
      "duringcreditsstinger",
      "aftercreditsstinger",
    ]),
    tag_labels: default_option_string_array(tag_labels, [
      "Genre",
      "Crew",
      "Cast",
      "Keyword",
      "Company",
      "Language",
      "Country",
    ]),
    tag_department_label: default_option_string_array(tag_department_label, []),
    tag_idf_min: default_option_number(tag_idf_min, 0),
    tag_idf_max: default_option_number(tag_idf_max, -1),
    movie_popularity_min: default_option_number(movie_popularity_min, 0),
    movie_popularity_max: default_option_number(movie_popularity_max, -1),
    movie_runtime_min: default_option_number(movie_runtime_min, 45),
    movie_runtime_max: default_option_number(movie_runtime_max, -1),
    movie_release_date_min: default_option_number(movie_release_date_min, -1),
    movie_release_date_max: default_option_number(movie_release_date_max, -1),
    movie_status: default_option_string_array(movie_status, [
      "Rumored",
      "Planned",
      "In Production",
      "Post Production",
      "Released",
      "Canceled",
    ]),
    movie_rating_min: default_option_number(movie_rating_min, -1),
    movie_rating_max: default_option_number(movie_rating_max, -1),
    movie_votes_min: default_option_number(movie_votes_min, 1000),
    movie_votes_max: default_option_number(movie_votes_max, -1),
    includeWatched: default_option_boolean(includeWatched, false),
    tagsRequired: default_option_string_array(tagsRequired, []),
    tagsBlacklist: default_option_string_array(tagsBlacklist, []),
    tagsOptional: default_option_string_array(tagsOptional, []),
    order_by: default_option_string(order_by, "vote_average"),
    order_by_dir: default_option_string(order_by_dir, "desc"),
    page: default_option_number(page, 1) || 1,
    per_page: default_option_number(per_page, 100) || 100,
  };
  return default_values;
};

router.get(
  "/:id/recommend/content",
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id = req.params.id;

    console.log(user_id);
    const options = set_query_values(req.query);
    console.log(options);

    try {
      const rec = await recommendations_for_user_content(user_id, options);
      const movies = rec.map((m) => m.details);
      await scrapeThumbnails(movies);

      res.status(200).json({ movies: rec });
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
      await scrapeThumbnails(rec);

      res.status(200).json({ movies: rec });
    } catch (error) {
      console.log(error);
      res.status(400).json({ status: "failed" });
    }
  }
);
module.exports = router;
