import { NextFunction, Request, Response } from "express";
import validate from "../middleware/validate";
import express from "express";
import { check, validationResult } from "express-validator";
const router = express.Router();

import { scrapeThumbnails } from "../util/recommendation_engine";
import { getMovies } from "../util/database_functions/movie";
import {
  ContentRecommendFilters,
  ContentRecommendQuery,
  MovieFilterParameters,
  PageOptions,
} from "../types";
import { recommendations_for_movie_content } from "../db_functions";

export const set_query_values = (query: ContentRecommendQuery) => {
  const {
    user_tag_rating_min,
    user_tag_frequency_min,
    useUserAvgRating,
    tag_popularity_min,
    tag_popularity_max,
    ignore_tags,
    tag_labels,
    tag_department_labels,
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
    tagsInCommon,
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
    ignore_tags: default_option_string_array(ignore_tags, []).concat([
      "duringcreditsstinger",
      "aftercreditsstinger",
    ]),
    tag_labels: default_option_string_array(tag_labels, [
      "Crew",
      "Cast",
      "Keyword",
    ]),
    tag_department_labels: default_option_string_array(
      tag_department_labels,
      []
    ),
    tag_idf_min: default_option_number(tag_idf_min, 0),
    tag_idf_max: default_option_number(tag_idf_max, -1),
    movie_popularity_min: default_option_number(movie_popularity_min, 0),
    movie_popularity_max: default_option_number(movie_popularity_max, -1),
    movie_runtime_min: default_option_number(movie_runtime_min, 45),
    movie_runtime_max: default_option_number(movie_runtime_max, -1),
    movie_release_date_min: default_option_number(movie_release_date_min, -1),
    movie_release_date_max: default_option_number(movie_release_date_max, -1),
    movie_status: default_option_string_array(movie_status, ["Released"]),
    movie_rating_min: default_option_number(movie_rating_min, -1),
    movie_rating_max: default_option_number(movie_rating_max, -1),
    movie_votes_min: default_option_number(movie_votes_min, 500),
    movie_votes_max: default_option_number(movie_votes_max, -1),
    includeWatched: default_option_boolean(includeWatched, false),
    tagsRequired: default_option_string_array(tagsRequired, []),
    tagsBlacklist: default_option_string_array(tagsBlacklist, []),
    tagsOptional: default_option_string_array(tagsOptional, []),
    tagsInCommon: default_option_number(tagsInCommon, 3),
    order_by: default_option_string(order_by, "vote_average"),
    order_by_dir: default_option_string(order_by_dir, "desc"),
    page: default_option_number(page, 1) || 1,
    per_page: default_option_number(per_page, 120) || 120,
  };
  return default_values;
};

router.get(
  "/:id/recommend",
  [
    check("user_tag_rating_min"),
    check("user_tag_frequency_min"),
    check("useUserAvgRating"),
    check("tag_popularity_min"),
    check("tag_popularity_max"),
    check("ignore_tags"),
    check("tag_labels"),
    check("tag_department_label"),
    check("tag_idf_min"),
    check("tag_idf_max"),
    check("movie_popularity_min"),
    check("movie_popularity_max"),
    check("movie_runtime_min"),
    check("movie_runtime_max"),
    check("movie_release_date_min"),
    check("movie_release_date_max"),
    check("movie_status"),
    check("movie_rating_min"),
    check("movie_rating_max"),
    check("movie_votes_min"),
    check("movie_votes_max"),
    check("includeWatched"),
    check("tagsRequired"),
    check("tagsBlacklist"),
    check("tagsOptional"),
    check("tagsInCommon"),
    check("order_by"),
    check("order_by_dir"),
    check("page"),
    check("per_page"),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    const movie_id = parseInt(req.params.id);
    console.log(movie_id);
    const options = set_query_values(req.query);
    try {
      const rec = await recommendations_for_movie_content(movie_id, options);
      const movies = rec.map((m) => m.details);

      await scrapeThumbnails(movies);

      res.status(200).json({ movies: rec });
    } catch (error) {
      console.log(error);
      res.status(400).json({ status: "failed" });
    }
  }
);

module.exports = router;
