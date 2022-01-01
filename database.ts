import axios from "axios";
import { neo4j } from "./config";
import {
  addMovieNotFoundId,
  add_movie_to_database,
  delete_movie_from_database,
  getAllMoviesNotFound,
  get_all_movie_ids_in_database,
  get_movies_to_update,
  parse_gender,
  set_idf_for_all_tags,
} from "./db_functions";
import {
  Cast,
  CreditsTMDB,
  Crew,
  FormattedCast,
  FormattedCompany,
  FormattedCountry,
  FormattedCrew,
  FormattedGenre,
  FormattedKeyword,
  FormattedLanguage,
  FormattedMovie,
  Genre,
  KeywordsTMDB,
  MovieTMDB,
  ProductionCompany,
  ProductionCountry,
  SpokenLanguage,
} from "./types";
require("dotenv").config();
const fs = require("fs").promises;

export const formatGenres = (genres: Genre[]): FormattedGenre[] => {
  return genres.map((genre) => {
    return genre;
  });
};
export const formatCompanies = (
  companies: ProductionCompany[]
): FormattedCompany[] => {
  return companies.map((company) => {
    return company;
  });
};
export const formatCountries = (
  countries: ProductionCountry[]
): FormattedCountry[] => {
  return countries.map((country) => {
    return country;
  });
};
export const formatLanguages = (
  languages: SpokenLanguage[]
): FormattedLanguage[] => {
  return languages.map((language) => {
    return language;
  });
};
export const formatKeywords = (
  tmdb_keywords: KeywordsTMDB
): FormattedKeyword[] => {
  const { id, keywords } = tmdb_keywords;

  return keywords;
};
export const formatCredits = (
  tmdb_credits: CreditsTMDB
): { cast: FormattedCast[]; crew: FormattedCrew[] } => {
  const { cast, crew, id } = tmdb_credits;
  return { cast: formatCast(cast), crew: formatCrew(crew) };
};
export const formatCast = (cast: Cast[]): FormattedCast[] => {
  return cast.map((member) => {
    const { gender } = member;
    return { ...member, gender: parse_gender(gender) };
  });
};
export const formatCrew = (crew: Crew[]): FormattedCrew[] => {
  return crew.map((member) => {
    const { gender } = member;
    return { ...member, gender: parse_gender(gender) };
  });
};

export const formatMovie = (
  movie: MovieTMDB
): {
  movie: FormattedMovie;
  genres: FormattedGenre[];
  production_companies: FormattedCompany[];
  production_countries: FormattedCountry[];
  spoken_languages: FormattedLanguage[];
} => {
  const {
    adult,
    backdrop_path,
    budget,
    genres,
    homepage,
    id,
    imdb_id,
    original_language,
    original_title,
    overview,
    popularity,
    poster_path,
    production_companies,
    production_countries,
    release_date,
    revenue,
    runtime,
    spoken_languages,
    status,
    tagline,
    title,
    video,
    vote_average,
    vote_count,
    belongs_to_collection,
  } = movie;
  const collection_id = belongs_to_collection ? belongs_to_collection.id : null;

  const formatted_movie = {
    adult,
    backdrop_path,
    budget,
    homepage,
    movieId: id,
    imdb_id,
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
    belongs_to_collection: collection_id,
  };
  return {
    movie: formatted_movie,
    genres: formatGenres(genres),
    production_companies: formatCompanies(production_companies),
    production_countries: formatCountries(production_countries),
    spoken_languages: formatLanguages(spoken_languages),
  };
};

export const getMovieById = async (id: number) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`,
      { timeout: 10 * 1000 }
    );
    const doujin: MovieTMDB = response.data;
    const formattedMovie = formatMovie(doujin);
    return formattedMovie;
  } catch (err) {
    if (
      // @ts-ignore
      err.response.data.status_message ==
      "The resource you requested could not be found."
    ) {
      // console.log("The resource you requested could not be found.");
      try {
        console.log(`${id} - Movie does not Exist`);
        await addMovieNotFoundId(id);
      } catch (error) {}
    }

    throw err;
  }
};
export const getMovieKeywordsById = async (id: number) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/keywords?api_key=${process.env.TMDB_API_KEY}`,
      { timeout: 10 * 1000 }
    );
    const keywords: KeywordsTMDB = response.data;
    const formattedKeywords = formatKeywords(keywords);
    return formattedKeywords;
  } catch (err) {
    //@ts-ignore
    if (err.message) {
      //@ts-ignore
      console.log(err.message);
    }
    console.log(`${id} - Keywords do not Exist`);

    throw err;
  }
};
export const getMovieCreditsById = async (id: number) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${process.env.TMDB_API_KEY}`,
      { timeout: 10 * 1000 }
    );
    const credits: CreditsTMDB = response.data;
    const formattedCredits = formatCredits(credits);
    return formattedCredits;
  } catch (err) {
    //@ts-ignore
    if (err.message) {
      //@ts-ignore
      console.log(err.message);
    }
    console.log(`${id} - Credits do not Exist`);

    throw err;
  }
};

export const removeElementsFromArray = (
  array: number[],
  toRemoveArray: number[]
) => {
  const toRemoveArraySet = new Set(toRemoveArray);

  return array.filter((num) => !toRemoveArraySet.has(num));
};

export const scrapeNHentai = async () => {
  const movie_ids = await get_movies_to_update();
  const all_movie_ids = await get_all_movie_ids_in_database();
  const all_movie_ids_set = new Set(all_movie_ids);
  const minId = all_movie_ids[0];
  const maxId = all_movie_ids[all_movie_ids.length - 1];
  const all_possible_ids: number[] = [];
  for (let index = 1; index <= maxId; index++) {
    all_possible_ids.push(index);
  }
  let not_in_db_ids = all_possible_ids.filter(
    (id) => !all_movie_ids_set.has(id)
  );
  let ids_to_ignore: number[] = [];
  try {
    ids_to_ignore = await getAllMoviesNotFound();
  } catch (error) {
    console.log("getting movies not found failed");
  }

  let need_to_do_ids = removeElementsFromArray(
    removeElementsFromArray(all_possible_ids, all_movie_ids),
    ids_to_ignore
  );

  let counter = 0;
  let interval = 1000;
  let limit = 100;

  let start = Date.now();
  let promises = [];
  let promiseIds: number[] = [];

  let to_do = removeElementsFromArray(all_possible_ids, ids_to_ignore);

  for (let i = 0; i < to_do.length; i++) {
    const id = to_do[i];
    // if (counter == interval) {
    //   counter = 0;
    //   let end = Date.now();
    //   let ms = end - start;
    //   let rem = need_to_do_ids.length - i + 1;
    //   let timeLeftHours = (ms / interval) * rem * (1 / (1000 * 60 * 60));
    //   let timeLeftMins = (timeLeftHours - Math.floor(timeLeftHours)) * 60;
    //   console.log(
    //     `Time Left: ${Math.floor(timeLeftHours)} Hours ${Math.floor(
    //       timeLeftMins
    //     )} Mins`
    //   );
    //   start = Date.now();
    // }
    // try {
    //   await add_movie_to_database(id);
    //   console.log(`id: ${id}`);
    // } catch (error) {
    //   if (
    //     //@ts-ignore
    //     error.response.data.status_message ==
    //     "The resource you requested could not be found."
    //   ) {
    //     await delete_movie_from_database(id);
    //     json.ignore.push(id);
    //     console.log(`id: ${id} - Error`);
    //   } else {
    //     //@ts-ignore
    //     console.log(error);
    //   }
    // }
    // counter++;
    promises.push(add_movie_to_database(id));
    promiseIds.push(id);
    if (promises.length == limit || i == need_to_do_ids.length - 1) {
      const p = await Promise.allSettled(promises);
      p.forEach((r, i) => {
        if (r.status == "rejected") {
          //   console.log(`id: ${promiseIds[i]} - Error`);
        } else {
          console.log(`id: ${promiseIds[i]}`);
        }
      });
      promises = [];
      promiseIds = [];
    }
  }

  const consecLimit = 1000;
  let id = maxId + 1;
  let consec_errors = 0;
  let isFinished = false;
  promises = [];
  promiseIds = [];
  while (!isFinished) {
    promises.push(add_movie_to_database(id));
    promiseIds.push(id);
    if (promises.length == limit) {
      const p = await Promise.allSettled(promises);
      p.forEach((r, i) => {
        if (r.status == "rejected") {
          consec_errors++;
          if (consec_errors > consecLimit) {
            isFinished = true;
          }
          //   console.log(`id: ${promiseIds[i]} - Error`);
        } else {
          consec_errors = 0;
          console.log(`id: ${promiseIds[i]}`);
        }
      });
      promises = [];
      promiseIds = [];
    }
    id++;
  }
  try {
    await set_idf_for_all_tags();
    console.log("updated idf");
  } catch (error) {
    console.log(error);
  }
  console.log(`Finished!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
  // await fs.writeFile("./ignore.json", JSON.stringify(json));
};
