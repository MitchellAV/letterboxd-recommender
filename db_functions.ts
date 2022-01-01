import { read, write } from "./neo4j";
import neo4j from "neo4j-driver";
import { Integer, toNumber } from "neo4j-driver-core";

import {
  getMovieById,
  getMovieCreditsById,
  getMovieKeywordsById,
} from "./database";
import {
  FormattedCast,
  FormattedCompany,
  FormattedCountry,
  FormattedCrew,
  FormattedGenre,
  FormattedKeyword,
  FormattedLanguage,
  OptionParameters,
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
    const { english_name, iso_639_1, name } = tag;
    if (!name) continue;
    await write(
      `MERGE (t:Language {name: $name})
      ON CREATE
        SET 
        t.iso_639_1 = $iso_639_1,
        t.english_name = $english_name,
        t:Tag
      WITH t
      MATCH (d:Movie {movieId: $movieId})
      WITH t,d
      MERGE (d)-[r:SPOKEN_IN]-(t)`,
      {
        movieId: setPropertyInt(movieId),
        english_name: setPropertyString(english_name),
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
    s.rating = avgRating,
    p.avg_rating = avgMovieRating`,
    {
      userId: userId,
    }
  ).catch((e) => {
    throw e;
  });
};

export const create_filter_query = (options: OptionParameters) => {
  const where: string[] = [];
  if (options) {
    const MIN_RATING = 0;
    const MIN_VOTES = 200;
    const MIN_RUNTIME = 0;
    const MIN_POPULARITY = 0;
    const MIN_IDF = 0;
    const USER_RATING_CUTOFF = "p1.avg_rating";
    const IS_ADULT = false;
    const INCLUDE_WATCHLIST = false;
    const BLACKLIST: string[] = [];
    const REQUIRED: string[] = [];
    const OPTIONAL: string[] = [];
    const IGNORE: string[] = [
      "duringcreditsstinger",
      "aftercreditsstinger",
      // "based on young adult novel",
    ];
    const IGNORE_LABEL: string[] = [
      // "Genre",
      // "Crew",
      // "Cast",
      // "Keyword",
      // "Company",
      // "Language",
      // "Country",
    ];

    const {
      avgRating,
      includeWatched,
      isAdult,
      numVotes,
      popularity,
      releaseDate,
      runtime,
      status,
      tagBlacklist,
      tagOptional,
      tagRequired,
      tagIgnore,
      tagRelevence,
      ignoreLabel,
      userRatingCutoff,
    } = options;

    where.push(`(r.order < 10  OR r.order IS NULL)`);

    const crewJobQuery: string[] = [];
    const crewJob = [
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
    crewJob.forEach((term) => crewJobQuery.push(`r.job = '${term}'`));
    crewJobQuery.length
      ? where.push("(" + crewJobQuery.join(" OR ") + " OR r.job IS NULL)")
      : null;

    userRatingCutoff
      ? where.push(`x.rating > ${userRatingCutoff}`)
      : where.push(`x.rating > ${USER_RATING_CUTOFF}`);

    avgRating?.min
      ? where.push(`p2.vote_average > ${avgRating.min}`)
      : where.push(`p2.vote_average > ${MIN_RATING}`);
    avgRating?.max ? where.push(`p2.vote_average < ${avgRating.max}`) : null;
    tagRelevence?.min
      ? where.push(`k.idf > ${tagRelevence.min}`)
      : where.push(`k.idf > ${MIN_IDF}`);
    tagRelevence?.max ? where.push(`k.idf < ${tagRelevence.max}`) : null;

    numVotes?.min
      ? where.push(`p2.vote_count > ${numVotes.min}`)
      : where.push(`p2.vote_count > ${MIN_VOTES}`);
    numVotes?.max ? where.push(`p2.vote_count < ${numVotes.max}`) : null;

    popularity?.min
      ? where.push(`p2.popularity > ${popularity.min}`)
      : where.push(`p2.popularity > ${MIN_POPULARITY}`);
    popularity?.max ? where.push(`p2.popularity < ${popularity.max}`) : null;

    runtime?.min
      ? where.push(`p2.runtime > ${runtime.min}`)
      : where.push(`p2.runtime > ${MIN_RUNTIME}`);
    runtime?.max ? where.push(`p2.runtime < ${runtime.max}`) : null;

    isAdult != undefined
      ? where.push(`p2.adult = ${isAdult ? "true" : "false"}`)
      : where.push(`p2.adult = ${IS_ADULT ? "true" : "false"}`);

    includeWatched != undefined
      ? where.push(
          `${
            includeWatched ? "" : "NOT"
          } EXISTS((:User {userId: $userId})-[:WATCHED]-(p2))`
        )
      : where.push(
          `${
            INCLUDE_WATCHLIST ? "" : "NOT"
          } EXISTS((:User {userId: $userId})-[:WATCHED]-(p2))`
        );

    const ignore = tagIgnore ? tagIgnore : IGNORE;
    ignore.forEach((term) => where.push(`k.name <> '${term}'`));
    const ignore_label = IGNORE_LABEL;
    ignore_label.forEach((term) => where.push(`NOT k:${term}`));

    const blacklist = tagBlacklist ? tagBlacklist : BLACKLIST;
    blacklist.forEach((term) =>
      where.push(`NOT EXISTS((p2)--(:Tag {name:'${term}'}))`)
    );

    const required = tagRequired ? tagRequired : REQUIRED;
    required.forEach((term) =>
      where.push(`EXISTS((p2)--(:Tag {name:'${term}'}))`)
    );
    const optionalQueries: string[] = [];
    const optional = tagOptional ? tagOptional : OPTIONAL;
    optional.forEach((term) =>
      optionalQueries.push(`EXISTS((p2)--(:Tag {name:'${term}'}))`)
    );
    optionalQueries.length
      ? where.push("(" + optionalQueries.join(" OR ") + ")")
      : null;
  }

  return where;
};
const f = (type: string) => {
  const x = `x.rating`;
  const b = `p1.avg_rating`;

  const polyFixedPointA = (yMax: number, n: number, b: string, c: number) =>
    `(( ${yMax} - ${c} ) / (( 10 - ${b} ) ^ ${n}))`;

  if (type == "linear") {
    const n = 1;
    const a = 0.5;
    const c = 1;
    // const maxPoint = 5;
    // const maxA = `(( ${maxPoint} - ${c} )/(10-${b}))`;
    return `( ${a} * ( ${x} - ${b} ) ^ ${n} + ${c})`;
  } else if (type == "cubic") {
    const n = 3;
    const c = 1;
    const a = polyFixedPointA(5, n, b, c); //0.05;
    // const maxPoint = 5;
    // const maxA = `(( ${maxPoint} - ${c} )/(10-${b}))`;
    return `( ${a} * ( ${x} - ${b} ) ^ ${n} + ${c})`;
  } else if (type == "exponential") {
    const a = 0.5;
    // const maxPoint = 5;
    // const maxA = `(( ${maxPoint} - ${c} )/(10-${b}))`;
    return `(exp(${a}*(${x}-${b})))`;
  }
  return;
};
export const recommendations_for_user_content = async (
  userId: string,
  options: OptionParameters
) => {
  const where = create_filter_query(options);

  const weighting = f("cubic");
  return read(
    `MATCH (p1:Pref {userId: $userId})-[x:SCORED]-(k:Tag)
    WITH p1,collect( ${weighting} * x.tf * k.idf ) as p1tfidf
    
    MATCH (p1)-[x:SCORED]-(k:Tag)-[r]-(p2:Movie)
    
    ${where.length ? "WHERE " + where.join(" AND ") : ""}

    WITH distinct k, ${weighting} * x.tf * k.idf * k.idf as weight,p1,x,p2,p1tfidf order by weight desc
    
    WITH SUM( ${weighting} * x.tf * k.idf * k.idf ) AS xyDotProduct,
    SQRT(REDUCE(xDot = 0.0, a IN p1tfidf | xDot + a^2)) AS xLength,
    p2,
    collect(k.name) as commonTags
    
    MATCH (p2)--(k2:Tag)
    WITH xyDotProduct,
    xLength,
    p2,
    commonTags,
    SQRT(REDUCE(yDot = 0.0, b IN COLLECT(k2.idf) | yDot + b^2)) AS yLength
    
    WITH p2, xyDotProduct / (xLength * yLength) AS sim,commonTags
    
    MATCH (p2)--(k:Tag)
    WITH p2,sim, k, commonTags order by k.idf 
    WITH p2,sim, collect(k.name) as tags, commonTags 
    
    RETURN p2,commonTags,sim,tags
    ORDER BY sim desc
    LIMIT 100`,
    {
      userId: userId,
    }
  )
    .then((results) => {
      return results.records.map((r) => {
        const d = r.get("p2").properties;

        const similarity = r.get("sim");
        const common = r.get("commonTags");
        const tags = r.get("tags");

        return {
          similarity,
          ...new Movie(d).toJson(),
          // tags,
          common,
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
