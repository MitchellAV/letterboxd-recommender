import { toNumber } from "neo4j-driver-core";
import { DatabaseMovie, MovieJSON } from "../types";

export default class Movie {
  adult: boolean | null;
  backdrop_path: string | null;
  belongs_to_collection: number | null;
  budget: number;
  homepage: string | null;
  lastUpdated: number;
  movieId: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  revenue: number;
  runtime: number | null;

  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  letterboxd_link: string | null;
  imdb_link: string;
  status:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";

  constructor(movie: DatabaseMovie) {
    const {
      adult,
      backdrop_path,
      belongs_to_collection,
      budget,
      homepage,
      imdb_id,
      letterboxd_id,
      lastUpdated,
      movieId,
      original_language,
      original_title,
      overview,
      popularity,
      poster_path,
      release_date,
      revenue,
      runtime,
      status,
      tagline,
      title,
      video,
      vote_average,
      vote_count,
    } = movie;
    this.adult = adult ? adult : null;
    this.backdrop_path = backdrop_path;
    this.belongs_to_collection = belongs_to_collection
      ? toNumber(belongs_to_collection)
      : null;
    this.budget = toNumber(budget);
    this.homepage = homepage;
    this.imdb_link = `https://www.imdb.com/title/${imdb_id}`;
    this.letterboxd_link = letterboxd_id
      ? `https://letterboxd.com/tmdb/${movieId}`
      : null;
    this.lastUpdated = toNumber(lastUpdated);
    this.movieId = toNumber(movieId);
    this.original_language = original_language;
    this.original_title = original_title;
    this.overview = overview;
    this.popularity = toNumber(popularity);
    this.poster_path = poster_path
      ? `https://image.tmdb.org/t/p/w500${poster_path}`
      : null;
    this.release_date = release_date;
    this.revenue = toNumber(revenue);
    this.runtime = runtime ? toNumber(runtime) : null;
    this.status = status;
    this.tagline = tagline ? tagline : null;
    this.title = title;
    this.video = video;
    this.vote_average = toNumber(vote_average);
    this.vote_count = toNumber(vote_count);
  }

  toJson(): MovieJSON {
    return {
      ...this,
    };
  }
}
