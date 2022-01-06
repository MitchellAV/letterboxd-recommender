import { read, write } from "./neo4j";
import neo4j from "neo4j-driver";
import { Integer, toNumber } from "neo4j-driver-core";

import {
  getMovieById,
  getMovieCreditsById,
  getMovieKeywordsById,
  removeElementsFromArray,
} from "./database";
import {
  ContentRecommendFilters,
  FormattedCast,
  FormattedCompany,
  FormattedCountry,
  FormattedCrew,
  FormattedGenre,
  FormattedKeyword,
  FormattedLanguage,
  MovieOptions,
  MovieTagOptions,
  MovieTagRelationshipOptions,
  OptionParameters,
  RecommendContentMovie,
  TagOptions,
  TagRelationshipOptions,
} from "./types";
import Movie from "./entities/Movie";
import axios from "axios";
require("dotenv").config();

export const parse_gender = (gender: number | null) => {
  if (gender == 1) {
    return "female";
  } else if (gender == 2) {
    return "male";
  } else {
    return null;
  }
};

export const setPropertyInt = (property: number | null) => {
  return property != null ? neo4j.int(property) : null;
};
export const setPropertyFloat = (property: number | null) => {
  return property != null ? property : null;
};
export const setPropertyBoolean = (property: boolean | null) => {
  return property != null ? property : null;
};
export const setPropertyString = (property: string | null) => {
  return property ? property : null;
};

export const createCrewRelationships = async (
  movieId: number,
  tags: FormattedCrew[]
) => {
  const popularity_limit = 1;
  for (const tag of tags) {
    const {
      adult,
      credit_id,
      department,
      gender,
      id,
      job,
      known_for_department,
      name,
      original_name,
      popularity,
      profile_path,
    } = tag;
    if (!id) continue;
    if (popularity < popularity_limit) continue;

    await write(
      `MERGE (t:Person {id: $id})
      ON CREATE
        SET 
          t.adult = $adult,
          t.gender = $gender,
          t.name = $name,
          t.original_name = $original_name,
          t.popularity = $popularity,
          t.profile_path = $profile_path,
          t.known_for_department = $known_for_department,
          t:Crew:Tag
      ON MATCH
        SET
          t.popularity = CASE WHEN $popularity > t.popularity THEN $popularity ELSE t.popularity END
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (t)-[r:WORKED_ON]-(d)
      ON CREATE
        SET 
          r.credit_id = $credit_id,
          r.department = $department,
          r.job = $job`,
      {
        movieId: setPropertyInt(movieId),

        id: setPropertyInt(id),
        adult: setPropertyBoolean(adult),
        gender: setPropertyString(gender),
        name: setPropertyString(name),
        original_name: setPropertyString(original_name),
        popularity: setPropertyFloat(popularity),
        profile_path: setPropertyString(profile_path),
        known_for_department: setPropertyString(known_for_department),

        credit_id: setPropertyString(credit_id),
        job: setPropertyString(job),
        department: setPropertyString(department),
      }
    ).catch((e) => {
      console.log(tag);

      console.log(e);

      throw e;
    });
  }
};
export const createCastRelationships = async (
  movieId: number,
  tags: FormattedCast[]
) => {
  const popularity_limit = 1;

  for (const tag of tags) {
    const {
      adult,
      cast_id,
      character,
      credit_id,
      gender,
      id,
      known_for_department,
      name,
      order,
      original_name,
      popularity,
      profile_path,
    } = tag;
    if (!id) continue;
    if (popularity < popularity_limit) continue;

    await write(
      `MERGE (t:Person {id: $id})
      ON CREATE
        SET 
        t.adult = $adult,
        t.gender = $gender,
        t.name = $name,
        t.original_name = $original_name,
        t.popularity = $popularity,
        t.profile_path = $profile_path,
        t.known_for_department = $known_for_department,
        t:Cast:Tag
      ON MATCH
        SET
        t.popularity = CASE WHEN $popularity > t.popularity THEN $popularity ELSE t.popularity END
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (t)-[r:ACTED_IN]-(d)
      ON CREATE
        SET 
        r.credit_id = $credit_id,
        r.cast_id = $cast_id,
        r.character = $character,
        r.order = $order`,
      {
        movieId: setPropertyInt(movieId),

        id: setPropertyInt(id),
        adult: setPropertyBoolean(adult),
        gender: setPropertyString(gender),
        name: setPropertyString(name),
        original_name: setPropertyString(original_name),
        popularity: setPropertyFloat(popularity),
        profile_path: setPropertyString(profile_path),
        known_for_department: setPropertyString(known_for_department),

        credit_id: setPropertyString(credit_id),
        cast_id: setPropertyInt(cast_id),
        character: setPropertyString(character),
        order: setPropertyInt(order),
      }
    ).catch((e) => {
      console.log(tag);
      console.log(e);

      throw e;
    });
  }
};
export const createCountryRelationships = async (
  movieId: number,
  tags: FormattedCountry[]
) => {
  for (const tag of tags) {
    const { iso_3166_1, name } = tag;
    if (!name) continue;

    await write(
      `MERGE (t:Country {name: $name})
      ON CREATE
        SET t.iso_3166_1 = $iso_3166_1,
        t:Tag
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (d)-[r:SHOT_IN]-(t)`,
      {
        movieId: setPropertyInt(movieId),
        name: setPropertyString(name),
        iso_3166_1: setPropertyString(iso_3166_1),
      }
    ).catch((e) => {
      console.log(tag);
      console.log(e);

      throw e;
    });
  }
};
export const createGenreRelationships = async (
  movieId: number,
  tags: FormattedGenre[]
) => {
  for (const tag of tags) {
    const { id, name } = tag;
    if (!id) continue;
    await write(
      `MERGE (t:Genre {id: $id})
      ON CREATE
        SET 
        t.name = $name,
        t:Tag
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (d)-[r:IN_GENRE]-(t)`,
      {
        movieId: setPropertyInt(movieId),
        id: setPropertyInt(id),
        name: setPropertyString(name),
      }
    ).catch((e) => {
      console.log(tag);
      console.log(e);

      throw e;
    });
  }
};
export const createKeywordRelationships = async (
  movieId: number,
  tags: FormattedKeyword[]
) => {
  for (const tag of tags) {
    const { id, name } = tag;
    if (!id) continue;

    await write(
      `MERGE (t:Keyword {id: $id})
      ON CREATE
        SET 
        t.name = $name,
        t:Tag
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (d)-[r:CONTAINS_KEYWORD]-(t)`,
      {
        movieId: setPropertyInt(movieId),
        id: setPropertyInt(id),
        name: setPropertyString(name),
      }
    ).catch((e) => {
      console.log(tag);
      console.log(e);

      throw e;
    });
  }
};
export const createCompanyRelationships = async (
  movieId: number,
  tags: FormattedCompany[]
) => {
  for (const tag of tags) {
    const { id, logo_path, name, origin_country } = tag;
    if (!id) continue;

    await write(
      `MERGE (t:Company {id: $id})
      ON CREATE
        SET 
        t.logo_path = $logo_path,
        t.name = $name,
        t.origin_country = $origin_country,
        t:Tag
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (d)-[r:PRODUCED_BY]-(t)`,
      {
        movieId: setPropertyInt(movieId),
        id: setPropertyInt(id),
        logo_path: setPropertyString(logo_path),
        name: setPropertyString(name),
        origin_country: setPropertyString(origin_country),
      }
    ).catch((e) => {
      console.log(tag);
      console.log(e);

      throw e;
    });
  }
};
export const createLanguageRelationships = async (
  movieId: number,
  tags: FormattedLanguage[]
) => {
  for (const tag of tags) {
    const { iso_639_1, name } = tag;
    if (!name) continue;
    await write(
      `MERGE (t:Language {name: $name})
      ON CREATE
        SET 
        t.iso_639_1 = $iso_639_1,
        t:Tag
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (d)-[r:SPOKEN_IN]-(t)`,
      {
        movieId: setPropertyInt(movieId),
        iso_639_1: setPropertyString(iso_639_1),
        name: setPropertyString(name),
      }
    ).catch((e) => {
      console.log(tag);
      console.log(e);

      throw e;
    });
  }
};

export const add_movie_to_database = async (id: number) => {
  try {
    const {
      genres,
      movie,
      production_companies,
      production_countries,
      spoken_languages,
    } = await getMovieById(id);
    const {
      adult,
      backdrop_path,
      belongs_to_collection,
      budget,
      homepage,
      imdb_id,
      original_language,
      original_title,
      movieId,
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
    if (!movieId) throw new Error("TMDB ID does not exist");
    if (movieId && !imdb_id) {
      await addMovieIgnoreId(movieId);
      throw new Error("Does not exist on IMDb");
    }

    await write(
      `MERGE (d:Movie {movieId:$movieId})
      SET
      d.adult = $adult,
      d.backdrop_path = $backdrop_path,
      d.belongs_to_collection = $belongs_to_collection,
      d.budget = $budget,
      d.homepage = $homepage,
      d.imdb_id = $imdb_id,
      d.original_language = $original_language,
      d.original_title = $original_title,
      d.overview = $overview,
      d.popularity = $popularity,
      d.poster_path = $poster_path,
      d.release_date = $release_date,
      d.revenue = $revenue,
      d.runtime = $runtime,
      d.status = $status,
      d.tagline = $tagline,
      d.title = $title,
      d.video = $video,
      d.vote_average = $vote_average,
      d.vote_count = $vote_count,
      d.lastUpdated = timestamp()`,
      {
        adult: setPropertyBoolean(adult),
        backdrop_path: setPropertyString(backdrop_path),
        belongs_to_collection: setPropertyInt(belongs_to_collection),
        budget: setPropertyInt(budget),
        homepage: setPropertyString(homepage),
        imdb_id: setPropertyString(imdb_id),
        original_language: setPropertyString(original_language),
        original_title: setPropertyString(original_title),
        movieId: setPropertyInt(movieId),
        overview: setPropertyString(overview),
        popularity: setPropertyFloat(popularity),
        poster_path: setPropertyString(poster_path),
        release_date: setPropertyString(release_date),
        revenue: setPropertyInt(revenue),
        runtime: setPropertyInt(runtime),
        status: setPropertyString(status),
        tagline: setPropertyString(tagline),
        title: setPropertyString(title),
        video: setPropertyBoolean(video),
        vote_average: setPropertyFloat(vote_average),
        vote_count: setPropertyInt(vote_count),
      }
    )
      .then(async (results) => {
        try {
          await createCountryRelationships(id, production_countries);
          await createCompanyRelationships(id, production_companies);
          await createGenreRelationships(id, genres);
          await createLanguageRelationships(id, spoken_languages);

          const keywords = await getMovieKeywordsById(id);
          const { cast, crew } = await getMovieCreditsById(id);

          if (keywords.length === 0) {
            console.log("Movie has no Keywords");
          } else {
            await createKeywordRelationships(id, keywords);
          }

          if (cast.length === 0) {
            console.log("Movie has no Cast");
          } else {
            await createCastRelationships(id, cast);
          }
          if (crew.length === 0) {
            console.log("Movie has no Crew");
          } else {
            await createCrewRelationships(id, crew);
          }

          if (cast && crew && keywords) {
            await addMovieIgnoreId(id);
          }
        } catch (error) {
          throw error;
        }
      })
      .catch((e) => {
        throw e;
      });
  } catch (error) {
    //@ts-ignore
    if (!axios.isAxiosError(error)) {
      //@ts-ignore
      console.log(error.message);
    }

    throw error;
  }
};
export const set_idf_for_all_tags = async () => {
  await write(
    `MATCH (d:Movie)
    WITH count(d) as totalMovies
    MATCH (k:Tag)--(d:Movie)
    WITH distinct k, totalMovies, count(d) as docsWithTerm 
    WITH k, log10( 1.0 * totalMovies / docsWithTerm ) as idf
    SET k.idf = idf`
  ).catch((e) => {
    throw e;
  });
};
export const delete_movie_from_database = async (movieId: number) => {
  await write(
    `MATCH (n:Movie {movieId: $movieId }) 
    DETACH DELETE n`,
    {
      movieId: neo4j.int(movieId),
    }
  ).catch((e) => {
    throw e;
  });
};
export const add_user_to_database = async (userId: string) => {
  await write(
    `MERGE (u:User {userId: $userId})
    RETURN u`,
    {
      userId: userId,
    }
  ).catch((e) => {
    console.log(e);

    throw e;
  });
};

export const get_movies_to_update = () => {
  return read(
    `MATCH (n:Movie) 
    where  n.lastUpdated IS NULL 
    // Older than 1 Day
    // OR n.lastUpdated < timestamp() - (1000*60*60*24*7)
    OR not exists((n)--(:Keyword))
    OR not exists((n)--(:Person))
    OR not exists((n)--())
    RETURN distinct n.movieId as id order by id`
  )
    .then((results) => {
      return results.records.map((r) => {
        const z = r.get("id");
        return toNumber(z);
      });
    })
    .catch((e) => {
      throw e;
    });
};

export const get_all_movie_ids_in_database = () => {
  return read(
    `MATCH (n:Movie) 
    RETURN n.movieId as id order by id`
  )
    .then((results) => {
      return results.records.map((r) => {
        const z = r.get("id");
        return toNumber(z);
      });
    })
    .catch((e) => {
      throw e;
    });
};
export const findIdByLetterboxdId = (id: number) => {
  return read(
    `MATCH (n:Movie {letterboxd_id: $id}) 
    RETURN n.movieId as id order by id`,
    { id: neo4j.int(id) }
  )
    .then((results) => {
      return toNumber(results.records[0].get("id"));
    })
    .catch((e) => {
      throw e;
    });
};
export const addLetterboxdIdToMovie = async (
  tmdb_id: number,
  letterboxd_id: number
) => {
  return write(
    `MATCH (n:Movie {movieId: $tmdb_id})
    SET n.letterboxd_id = $letterboxd_id`,
    { tmdb_id: neo4j.int(tmdb_id), letterboxd_id: neo4j.int(letterboxd_id) }
  ).catch((e) => {
    throw e;
  });
};
export const addMovieNotFoundId = async (tmdb_id: number) => {
  return write(`MERGE (n:NotFound {movieId: $tmdb_id})`, {
    tmdb_id: neo4j.int(tmdb_id),
  }).catch((e) => {
    throw e;
  });
};
export const getAllMoviesNotFound = async () => {
  return write(
    `MATCH (n)
    WHERE n:NotFound OR n:Ignore 
    RETURN n.movieId as id order by id`
  )
    .then((results) => {
      return results.records.map((r) => {
        const z = r.get("id");
        return toNumber(z);
      });
    })
    .catch((e) => {
      throw e;
    });
};
export const addMovieIgnoreId = async (tmdb_id: number) => {
  return write(`MERGE (n:Ignore {movieId: $tmdb_id})`, {
    tmdb_id: neo4j.int(tmdb_id),
  }).catch((e) => {
    throw e;
  });
};
export const getAllMoviesIgnore = async () => {
  return write(
    `MATCH (n:Ignore) 
    RETURN n.movieId as id order by id`
  )
    .then((results) => {
      return results.records.map((r) => {
        const z = r.get("id");
        return toNumber(z);
      });
    })
    .catch((e) => {
      throw e;
    });
};

export const add_watched_movie_to_user = async (
  userId: string,
  movie: {
    rating: number | null;
    tmdb_id: number;
  }
) => {
  const { rating, tmdb_id } = movie;
  let params: {
    userId: string;
    movieId: Integer;
    rating?: Integer;
  } = {
    userId: userId,
    movieId: neo4j.int(tmdb_id),
  };
  if (rating) params.rating = neo4j.int(rating);
  await write(
    `MATCH (u:User {userId: $userId })
    MATCH (m:Movie {movieId: $movieId })
    MERGE (u)-[:WATCHED ${rating ? "{rating: $rating }" : ""}]-(m)
`,
    params
  ).catch((e) => {
    throw e;
  });
};

export const clear_watched_movie_from_user = async (userId: string) => {
  await write(
    `MATCH (u:User {userId: $userId})-[r:WATCHED]->(:Movie)
    DELETE r`,
    {
      userId: userId,
    }
  ).catch((e) => {
    throw e;
  });
};

export const add_watched_movies_to_user = async (
  userId: string,
  watched_movies: {
    rating: number | null;
    tmdb_id: number;
  }[]
) => {
  for (const movie of watched_movies) {
    await add_watched_movie_to_user(userId, movie);
  }
};
export const clear_prefs_from_user = async (userId: string) => {
  await write(
    `MATCH (u:Pref {userId: $userId})-[r:SCORED]->()
    DELETE r`,
    {
      userId: userId,
    }
  ).catch((e) => {
    throw e;
  });
};

export const create_prefs_for_user = async (userId: string) => {
  await write(
    `MATCH (u:User {userId: $userId })-[r:WATCHED]-(:Movie)--(t:Tag)
    WITH u,avg(r.rating) as avgMovieRating
    SET u.avg_rating = avgMovieRating
    WITH u,avgMovieRating
    MATCH (u)-[r:WATCHED]-(:Movie)--(t:Tag)
    WITH u,count(t) AS totalUserTags, avgMovieRating
    MATCH (u)-[r:WATCHED]-(:Movie)--(t:Tag)
    WITH distinct t, avg(r.rating) as avgRating, totalUserTags, count(t) AS freq, avgMovieRating 
    WITH avgRating, avgMovieRating,freq, t, 1.0 * freq / totalUserTags as tf order by avgRating desc
    MERGE (p:Pref {userId: $userId })
    WITH t,avgRating, p, freq, tf, avgMovieRating
    MERGE (p)-[s:SCORED {tf:tf,freq:freq}]-(t)
    SET 
    s.rating = CASE 
    WHEN avgMovieRating IS NULL THEN 1.0
    WHEN avgRating IS NULL THEN avgMovieRating
    ELSE avgRating END,
    p.avg_rating = CASE 
    WHEN avgMovieRating IS NULL THEN 1.0
    ELSE avgMovieRating END`,
    {
      userId: userId,
    }
  ).catch((e) => {
    throw e;
  });
};

const weight_rating = (
  type: "linear" | "cubic" | "exponential" | "uniform" | "rating",
  useFixed: boolean,
  fixedMaxValue: number
) => {
  const x = `x.rating`;
  const b = `p1.avg_rating`;
  const yMax = fixedMaxValue;

  const polyFixedPointA = (yMax: number, n: number, b: string, c: number) =>
    `(( ${yMax} - ${c} ) / (( 10 - ${b} ) ^ ${n}))`;
  const expFixedPointA = (yMax: number, b: string) =>
    `(log(${yMax})/(10 - ${b}))`;

  if (type == "linear") {
    const n = 1;
    const c = 1;
    const a = useFixed ? polyFixedPointA(yMax, 1, b, c) : 1;
    return `( ${a} * ( ${x} - ${b} ) ^ ${n} + ${c})`;
  } else if (type == "cubic") {
    const n = 3;
    const c = 1;
    const a = useFixed ? polyFixedPointA(yMax, 1, b, c) : 0.05;
    return `( ${a} * ( ${x} - ${b} ) ^ ${n} + ${c})`;
  } else if (type == "exponential") {
    const a = useFixed ? expFixedPointA(yMax, b) : 0.5;
    return `(exp(${a}*(${x}-${b})))`;
  } else if (type == "uniform") {
    return `(${x}-${b})`;
  } else if (type == "rating") {
    return `(${x})`;
  }
  return;
};

const create_where_tag = (options: TagOptions) => {
  const where: string[] = [];
  const label = "k";
  if (options) {
    const {
      ignore_tags,
      tag_idf,
      tag_labels,
      tag_popularity,
      tag_department_label,
    } = options;

    // ALL Tags
    // IDF
    tag_idf.min > 0 && where.push(`${label}.idf >= ${tag_idf.min}`);
    tag_idf.max > 0 && where.push(`${label}.idf <= ${tag_idf.max}`);

    // NAME
    ignore_tags.forEach((term) => where.push(`${label}.name <> '${term}'`));

    // LABEL
    const all_tag_labels = [
      "Genre",
      "Crew",
      "Cast",
      "Keyword",
      "Company",
      "Language",
      "Country",
    ];

    removeElementsFromArray(all_tag_labels, tag_labels).forEach((term) =>
      where.push(`NOT ${label}:${term}`)
    );

    // Person
    const ignore_known_for_department_labels: string[] = [
      // "Writing",
      // "Costume & Make-Up",
      // "Production",
      // "Acting",
      // "Directing",
      // "Art",
      // "Editing",
      // "Sound",
      // "Visual Effects",
      // "Crew",
      // "Camera",
      // "Lighting",
      // "Creator",
    ];
    const known_for_department_query = ignore_known_for_department_labels.map(
      (term) => `${label}.known_for_department <> '${term}'`
    );
    known_for_department_query.length &&
      where.push(
        "(" +
          known_for_department_query.join(" OR ") +
          ` OR ${label}.known_for_department IS NULL)`
      );

    // POPULARITY
    const popularityQuery: string[] = [];
    tag_popularity.min > 0 &&
      popularityQuery.push(`${label}.popularity >= ${tag_popularity.min}`);
    tag_popularity.max > 0 &&
      popularityQuery.push(`${label}.popularity <= ${tag_popularity.max}`);
    popularityQuery.length &&
      where.push(
        "(" + popularityQuery.join(" OR ") + ` OR ${label}.popularity IS NULL)`
      );
  }

  return where;
};
const create_where_tag_relationship = (options: TagRelationshipOptions) => {
  const where: string[] = [];
  const prefLabel = "p1";
  const relLabel = "x";
  if (options) {
    const { user_tag_frequency, user_tag_rating, useUserAvgRating } = options;

    // ALL Tags
    // FREQUENCY
    user_tag_frequency.min > 0 &&
      where.push(`${relLabel}.freq >= ${user_tag_frequency.min}`);
    // FREQUENCY

    if (useUserAvgRating) {
      where.push(`${relLabel}.rating >= ${prefLabel}.avg_rating`);
    } else {
      user_tag_rating.min > 0 &&
        where.push(`${relLabel}.rating >= ${user_tag_rating.min}`);
    }
  }

  return where;
};
const create_where_movie_tag_relationship = (
  options: MovieTagRelationshipOptions
) => {
  const where: string[] = [];
  const prefLabel = "p2";
  const relLabel = "r";
  if (options) {
    const { cast_order, crew_job } = options;

    // ALL Tags
    const MIN_ACTORS = 10;
    cast_order.min > 0 &&
      where.push(`(${relLabel}.order < ${cast_order.min}  OR r.order IS NULL)`);

    const crewJobQuery: string[] = [];
    const DEFAULT_CREW_JOB = [
      "Director",
      "Screenplay",
      "Writer",
      "Director of Photography",
      "Original Music Composer",
      "Editor",
      // "Art Direction",
      // "Music",
      // "Story",
      // "Costume Design",
      // "Novel",
      // 'Production Design',
      // "Animation",
    ];

    crew_job.forEach((term) =>
      crewJobQuery.push(`${relLabel}.job = '${term}'`)
    );
    crewJobQuery.length
      ? where.push(
          "(" + crewJobQuery.join(" OR ") + ` OR ${relLabel}.job IS NULL)`
        )
      : null;
  }

  return where;
};

const create_where_movie = (options: MovieOptions) => {
  const where: string[] = [];
  const label = "p2";
  if (options) {
    const {
      movie_popularity,
      movie_rating,
      movie_release_date,
      movie_runtime,
      movie_status,
      movie_votes,
    } = options;

    // ALL Tags
    // TITLE
    // RATING
    movie_rating.min > 0 &&
      where.push(`${label}.vote_average >= ${movie_rating.min}`);
    movie_rating.max > 0 &&
      where.push(`${label}.vote_average <= ${movie_rating.max}`);

    // VOTES
    movie_votes.min > 0 &&
      where.push(`${label}.vote_count >= ${movie_votes.min}`);
    movie_votes.max > 0 &&
      where.push(`${label}.vote_count <= ${movie_votes.max}`);

    // POPULARITY

    movie_popularity.min > 0 &&
      where.push(`${label}.popularity >= ${movie_popularity.min}`);
    movie_popularity.max > 0 &&
      where.push(`${label}.popularity <= ${movie_popularity.max}`);

    // RUNTIME
    movie_runtime.min > 0 &&
      where.push(`${label}.runtime >= ${movie_runtime.min}`);
    movie_runtime.max > 0 &&
      where.push(`${label}.runtime <= ${movie_runtime.max}`);

    // RELEASE DATE
    movie_release_date.min > 0 &&
      where.push(`${label}.release_date >= '${movie_release_date.min}-01-01'`);
    movie_release_date.max > 0 &&
      where.push(`${label}.release_date <= '${movie_release_date.max}-01-01'`);

    // Person
    const DEFAULT_IGNORE_STATUS: string[] = [
      // "Rumored",
      // "Planned",
      // "In Production",
      // "Post Production",
      // "Released",
      // "Canceled",
    ];
    const status_query = movie_status.map(
      (term) => `${label}.status <> '${term}'`
    );
    status_query.length && where.push(`(${status_query.join(" OR ")})`);
  }

  return where;
};
const create_where_movie_tag = (options: MovieTagOptions) => {
  const where: string[] = [];
  const label = "p2";
  if (options) {
    const { tagsBlacklist, tagsOptional, tagsRequired, includeWatched } =
      options;

    where.push(
      `${
        includeWatched || "NOT"
      } EXISTS((:User {userId: $userId})-[:WATCHED]-(${label}))`
    );

    tagsBlacklist.forEach((term) =>
      where.push(`NOT EXISTS((${label})--(:Tag {name:'${term}'}))`)
    );

    tagsRequired.forEach((term) =>
      where.push(`EXISTS((${label})--(:Tag {name:'${term}'}))`)
    );
    const optionalQueries: string[] = [];

    tagsOptional.forEach((term) =>
      optionalQueries.push(`EXISTS((${label})--(:Tag {name:'${term}'}))`)
    );
    optionalQueries.length &&
      where.push("(" + optionalQueries.join(" OR ") + ")");
  }

  return where;
};
export const recommendations_for_user_content = async (
  userId: string,
  options: ContentRecommendFilters
): Promise<RecommendContentMovie[]> => {
  const {
    tag_labels,
    ignore_tags,
    includeWatched,
    movie_popularity_max,
    movie_popularity_min,
    movie_rating_max,
    movie_rating_min,
    movie_release_date_max,
    movie_release_date_min,
    movie_runtime_max,
    movie_runtime_min,
    movie_status,
    movie_votes_max,
    movie_votes_min,
    order_by,
    order_by_dir,
    page,
    per_page,
    tag_department_label,
    tag_idf_max,
    tag_idf_min,
    tag_popularity_max,
    tag_popularity_min,
    tagsBlacklist,
    tagsOptional,
    tagsRequired,
    useUserAvgRating,
    user_tag_frequency_min,
    user_tag_rating_min,
  } = options;
  // const where = create_filter_query(options);
  const tagRelationshipWhere = create_where_tag_relationship({
    useUserAvgRating,
    user_tag_frequency: { min: user_tag_frequency_min, max: -1 },
    user_tag_rating: { min: user_tag_rating_min, max: -1 },
  });
  const tagWhere = create_where_tag({
    ignore_tags,
    tag_labels,
    tag_department_label,
    tag_idf: { max: tag_idf_max, min: tag_idf_min },
    tag_popularity: { max: tag_popularity_max, min: tag_popularity_min },
  });
  const movieTagRelationshipWhere = create_where_movie_tag_relationship({
    cast_order: { max: -1, min: 10 },
    crew_job: ["Director", "Director of Photography", "Executive Producer"],
  });
  const movieWhere = create_where_movie({
    movie_runtime: { min: movie_runtime_min, max: movie_runtime_max },
    movie_votes: { min: movie_votes_min, max: movie_votes_max },
    movie_popularity: { max: movie_popularity_max, min: movie_popularity_min },
    movie_rating: { max: movie_rating_max, min: movie_rating_min },
    movie_release_date: {
      max: movie_release_date_max,
      min: movie_release_date_min,
    },
    movie_status,
  });
  const movieRelationshipsWhere = create_where_movie_tag({
    tagsRequired,
    includeWatched,
    tagsBlacklist,
    tagsOptional,
  });

  const rating_weight = weight_rating("exponential", true, 10);
  const tagPrefWhere = [...tagWhere, ...tagRelationshipWhere];
  const tagPrefMovieWhere = [
    ...tagWhere,
    ...tagRelationshipWhere,
    ...movieTagRelationshipWhere,
    ...movieWhere,
    ...movieRelationshipsWhere,
  ];
  const tagMovieWhere = [
    ...tagWhere,
    ...movieWhere,
    ...movieTagRelationshipWhere,
    ...movieRelationshipsWhere,
  ];
  // ${where.length ? "WHERE " + where.join(" AND ") : ""}
  return read(
    `MATCH (p1:Pref {userId: $userId})-[x:SCORED]-(k:Tag)
    
    ${tagPrefWhere.length && "WHERE " + tagPrefWhere.join(" AND ")}
   
    WITH p1,collect( ${rating_weight} * x.tf * k.idf ) as p1tfidf
    
    MATCH (p1)-[x:SCORED]-(k:Tag)-[r]-(p2:Movie)
    
    ${tagPrefMovieWhere.length && "WHERE " + tagPrefMovieWhere.join(" AND ")}

    
    WITH distinct k, ${rating_weight} * x.tf * k.idf * k.idf as weight, p1, x, p2, p1tfidf order by weight desc
    
    WITH SUM( weight ) AS xyDotProduct,
    SQRT(REDUCE(xDot = 0.0, a IN p1tfidf | xDot + a^2)) AS xLength,
    p2,
    collect(k.name) as commonTags
    
    MATCH (p2)-[r]-(k:Tag)
    ${tagMovieWhere.length && "WHERE " + tagMovieWhere.join(" AND ")}
    WITH xyDotProduct,
    xLength,
    p2,
    commonTags,
    SQRT(REDUCE(yDot = 0.0, b IN COLLECT(k.idf) | yDot + b^2)) AS yLength
    
    WITH p2, xyDotProduct / (xLength * yLength) AS sim,commonTags
    
    MATCH (p2)--(k:Tag)
    WITH p2,sim, k, commonTags order by k.idf 
    WITH p2,sim, collect(k.name) as tags, commonTags 
    
    RETURN p2,commonTags,sim,tags
    ORDER BY sim ${order_by_dir} SKIP ${
      (page - 1) * per_page
    } LIMIT ${per_page}`,
    {
      userId: userId,
    }
  )
    .then((results) => {
      return results.records.map((r) => {
        const d = r.get("p2").properties;

        const similarity: number = r.get("sim");
        const common: string[] = r.get("commonTags");
        const tags: string[] = r.get("tags");
        // console.log(common[0]);

        return {
          similarity,
          details: new Movie(d).toJson(),
          tags,
          common: common.slice(0, 5),
        };
      });
    })
    .catch((e) => {
      throw e;
    });
};
export const recommendations_for_movie_content = async (
  movieId: number,
  options: OptionParameters
) => {
  // const where = create_filter_query(options);

  // const rating_weight = weight_rating("exponential", true);
  // ${where.length ? "WHERE " + where.join(" AND ") : ""}
  return read(
    `MATCH (p1:Movie {movieId: $movieId})--(k:Tag)
    WITH p1, collect(  k.idf ) as p1tfidf
    
    MATCH (p1)--(k:Tag)--(p2:Movie)
    WHERE p2.vote_count > 100 AND p2.runtime >= 45
    
    WITH distinct k,  k.idf *  k.idf as weight, p1, p2, p1tfidf
    
    WITH SUM( weight ) AS xyDotProduct,
    SQRT(REDUCE(xDot = 0.0, a IN p1tfidf | xDot + a^2)) AS xLength,
    p2,
    collect(k) as commonTags
    
    MATCH (p2)--(k2:Tag)
    WITH xyDotProduct,
    xLength,
    p2,
    commonTags,
    SQRT(REDUCE(yDot = 0.0, b IN COLLECT( k2.idf) | yDot + b^2)) AS yLength
    
    WITH p2, xyDotProduct / (xLength * yLength) AS sim,commonTags
    
    MATCH (p2)--(k:Tag)
    WITH p2,sim, k, commonTags order by k.idf 
    WITH p2,sim, collect(k.name) as tags, commonTags 
    
    RETURN p2,commonTags,sim,tags
    ORDER BY sim desc
    LIMIT 100`,
    {
      movieId: movieId,
    }
  )
    .then((results) => {
      return results.records.map((r) => {
        const d = r.get("p2").properties;

        const similarity = r.get("sim");
        const common: string[] = r.get("commonTags");
        const tags: string[] = r.get("tags");

        return {
          // similarity,
          ...new Movie(d).toJson(),
          // tags,
          // common,
        };
      });
    })
    .catch((e) => {
      throw e;
    });
};
export const recommendations_for_user_collaborative = async (
  userId: string,
  options: OptionParameters
) => {
  // const where = create_filter_query(options);

  // const weighting = f("cubic");
  return read(
    `MATCH (u1:User {userId: $userId})-[r:WATCHED]-(m:Movie)
    WITH u1, avg(r.rating) AS u1_mean
    
    MATCH (u1)-[r1:WATCHED]-(m:Movie)-[r2:WATCHED]-(u2)
    WITH u1, u1_mean, u2, COLLECT({r1: r1, r2: r2}) AS ratings
    
    MATCH (u2)-[r:WATCHED]-(m:Movie)
    WITH u1, u1_mean, u2, avg(r.rating) AS u2_mean, ratings
    
    UNWIND ratings AS r
    
    WITH sum( (r.r1.rating-u1_mean) * (r.r2.rating-u2_mean) ) AS nom,
         sqrt( sum( (r.r1.rating - u1_mean)^2) * sum( (r.r2.rating - u2_mean) ^2)) AS denom,
         u1, u2 WHERE denom <> 0
    
    WITH u1, u2, nom/denom AS pearson
    ORDER BY pearson DESC
    
    MATCH (u2)-[r:WATCHED]-(m:Movie) 
    WHERE NOT EXISTS( (u1)-[:WATCHED]-(m) )
    AND u2.avg_rating < r.rating
    RETURN m,u2.userId as user,r.rating as user_score, SUM( pearson * r.rating) AS score
    ORDER BY score DESC, m.vote_average DESC LIMIT 100`,
    {
      userId: userId,
    }
  )
    .then((results) => {
      return results.records.map((r) => {
        const d = r.get("m").properties;

        const similarity = r.get("score");
        const because_of = r.get("user");
        const user_score = r.get("user_score");

        return {
          similarity,
          because_of,
          user_score: toNumber(user_score),
          ...new Movie(d).toJson(),
          // tags,
        };
      });
    })
    .catch((e) => {
      throw e;
    });
};
