export interface Error {
  message: string;
  status: number;
  error: any[];
}

export interface QueryParams {
  filter: string | null;
  min_vote_count: string | number;
  min_vote_average: string | number;
  min_runtime: string | number;
  num_per_page: string | number;
  order: 1 | -1;
  sort_type: string;
  page: number;
}

export interface FilterParams {
  min_vote_average: number;
  filter: string;
  min_vote_count: number;
  min_runtime: number;
  num_per_page: number;
  sort_type: string;
  order: 1 | -1;
  page: number;
}
///////////////////////

///////////////////////////////
// TMDB Credits Json format
export interface Cast {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
}

export interface Crew {
  adult: boolean;
  gender: number | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department: string;
  job: string;
}

export interface CreditsTMDB {
  id: number;
  cast: Cast[];
  crew: Crew[];
}

// TMDB Keyword JSon Format
export interface Keyword {
  id: number;
  name: string;
}

export interface KeywordsTMDB {
  id: number;
  keywords: Keyword[];
}

// TMDB MOVIE JSON FORMAT
export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface BelongsToCollection {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
}

export interface MovieTMDB {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: BelongsToCollection | null;
  budget: number;
  genres: Genre[];
  homepage: string | null;
  id: number;
  imdb_id: string | null;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  production_companies: ProductionCompany[];
  production_countries: ProductionCountry[];
  release_date: string;
  revenue: number;
  runtime: number | null;
  spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface FormattedMovie {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: number | null;
  budget: number;
  //   genres: Genre[];
  homepage: string | null;
  movieId: number;
  imdb_id: string | null;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  //   production_companies: ProductionCompany[];
  //   production_countries: ProductionCountry[];
  release_date: string;
  revenue: number;
  runtime: number | null;
  //   spoken_languages: SpokenLanguage[];
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface FormattedGenre {
  id: number;
  name: string;
}
export interface FormattedCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}
export interface FormattedCountry {
  iso_3166_1: string;
  name: string;
}
export interface FormattedLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}
export interface FormattedKeyword {
  id: number;
  name: string;
}
export interface FormattedCredits {
  cast: Cast[];
  crew: Crew[];
}
export interface FormattedCast {
  adult: boolean;
  gender: string | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
  character: string;
  credit_id: string;
  order: number;
}
export interface FormattedCrew {
  adult: boolean;
  gender: string | null;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  credit_id: string;
  department: string;
  job: string;
}

export interface DatabaseMovie {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: number | null;
  budget: number;
  homepage: string | null;
  imdb_id: string;
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
  status: string;
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface OptionParameters {
  isAdult?: boolean;
  popularity?: { min: number; max: number };
  releaseDate?: { min: number; max: number };
  runtime?: { min: number; max: number };
  status?: string;
  avgRating?: { min: number; max: number };
  numVotes?: { min: number; max: number };
  includeWatched?: boolean;
  tagBlacklist?: string[];
  tagRequired?: string[];
  tagOptional?: string[];
  tagIgnore?: string[];
  ignoreLabel?: string[];
  userRatingCutoff?: number;
  tagRelevence?: { min: number; max: number };
}
