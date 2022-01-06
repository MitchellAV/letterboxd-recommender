import { read, write } from "../../neo4j";
import neo4j from "neo4j-driver";
import { Integer, toNumber } from "neo4j-driver-core";

import {
  getMovieById,
  getMovieCreditsById,
  getMovieKeywordsById,
} from "../../database";
import {
  FormattedCast,
  FormattedCompany,
  FormattedCountry,
  FormattedCrew,
  FormattedGenre,
  FormattedKeyword,
  FormattedLanguage,
  MovieFilterParameters,
  OptionParameters,
  PageOptions,
} from "../../types";
import Movie from "../../entities/Movie";
import axios from "axios";
require("dotenv").config();

export const movie_filter_query = (filter: MovieFilterParameters) => {
  const where: string[] = [];
  const IS_ADULT = false;
  const MIN_RATING = 0;
  const MIN_VOTES = 0;
  const MIN_RUNTIME = 0;
  const MIN_POPULARITY = 0;
  const BLACKLIST: string[] = [];
  const REQUIRED: string[] = [];
  const OPTIONAL: string[] = [];

  const {
    avgRating,
    isAdult,
    numVotes,
    popularity,
    runtime,
    status,
    tagBlacklist,
    tagOptional,
    tagRequired,
    title,
  } = filter;

  status && where.push(`n.status = '${status}'`);

  title && where.push(`n.title =~ '(?i).*${title}.*'`);

  isAdult != undefined
    ? where.push(`n.adult = ${isAdult ? "true" : "false"}`)
    : where.push(`n.adult = ${IS_ADULT ? "true" : "false"}`);

  avgRating?.min
    ? where.push(`n.vote_average >= ${avgRating.min}`)
    : where.push(`n.vote_average >= ${MIN_RATING}`);

  avgRating?.max && where.push(`n.vote_average <= ${avgRating.max}`);

  numVotes?.min
    ? where.push(`n.vote_count >= ${numVotes.min}`)
    : where.push(`n.vote_count >= ${MIN_VOTES}`);

  numVotes?.max && where.push(`n.vote_count <= ${numVotes.max}`);

  popularity?.min
    ? where.push(`n.popularity >= ${popularity.min}`)
    : where.push(`n.popularity >= ${MIN_POPULARITY}`);

  popularity?.max && where.push(`n.popularity <= ${popularity.max}`);

  runtime?.min
    ? where.push(`n.runtime >= ${runtime.min}`)
    : where.push(`n.runtime >= ${MIN_RUNTIME}`);

  runtime?.max && where.push(`n.runtime <= ${runtime.max}`);

  const blacklist = tagBlacklist ? tagBlacklist : BLACKLIST;
  blacklist.forEach((term) =>
    where.push(`NOT EXISTS((n)--(:Tag {name:'${term}'}))`)
  );

  const required = tagRequired ? tagRequired : REQUIRED;
  required.forEach((term) =>
    where.push(`EXISTS((n)--(:Tag {name:'${term}'}))`)
  );

  const optional = tagOptional ? tagOptional : OPTIONAL;
  const optionalQueries: string[] = [];
  optional.forEach((term) =>
    optionalQueries.push(`EXISTS((n)--(:Tag {name:'${term}'}))`)
  );
  optionalQueries.length
    ? where.push("(" + optionalQueries.join(" OR ") + ")")
    : null;

  return where;
};

export const getMovies = (
  filter: MovieFilterParameters,
  options: PageOptions
) => {
  const where = movie_filter_query(filter);
  const { order_by, order_by_dir, page, per_page } = options;
  const DEFAULT_ORDER_BY = "vote_count";
  const DEFAULT_ORDER_BY_DIR = "DESC";
  return read(
    `MATCH (n:Movie) 
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
      RETURN n ORDER BY n.${order_by ? order_by : DEFAULT_ORDER_BY} ${
      order_by_dir ? order_by_dir : DEFAULT_ORDER_BY_DIR
    } SKIP ${(page - 1) * per_page} LIMIT ${per_page}`
  )
    .then((results) => {
      return results.records.map((r) => {
        const d = r.get("n").properties;

        return new Movie(d).toJson();
      });
    })
    .catch((e) => {
      throw e;
    });
};
