export interface Error {
  message: string;
  status: number;
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
  status:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";
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
  status:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";
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
  letterboxd_id?: number;
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
  status:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
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
  status:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface OptionParameters {
  user_tag_rating_min?: number;
  user_tag_frequency_min?: number;
  useUserAvgRating?: boolean;
  tag_popularity?: { min?: number; max?: number };
  ignore_tags?: string[];
  tag_labels?: TagLabel[];
  tag_department_label?: string[];
  tag_idf?: { min?: number; max?: number };
  movie_popularity?: { min?: number; max?: number };
  movie_runtime?: { min?: number; max?: number };
  movie_release_date?: { min?: number; max?: number };
  movie_status?: Status[];
  movie_rating?: { min?: number; max?: number };
  movie_votes?: { min?: number; max?: number };
  includeWatched?: boolean;
  tagsRequired?: string[];
  tagsBlacklist?: string[];
  tagsOptional?: string[];
  order_by?:
    | "title"
    | "popularity"
    | "release_date"
    | "runtime"
    | "vote_average"
    | "vote_count";
  order_by_dir?: "asc" | "desc";
  page?: number;
  per_page?: number;
}
type TagLabel =
  | "Genre"
  | "Crew"
  | "Cast"
  | "Keyword"
  | "Company"
  | "Language"
  | "Country";
export interface TagOptions {
  tag_popularity: { min: number; max: number };
  ignore_tags: string[];
  tag_labels: TagLabel[];
  tag_department_labels: string[];
  tag_idf: { min: number; max: number };
}
type Status =
  | "Rumored"
  | "Planned"
  | "In Production"
  | "Post Production"
  | "Released"
  | "Canceled";
export interface MovieOptions {
  title: string;
  movie_popularity: { min: number; max: number };
  movie_runtime: { min: number; max: number };
  movie_release_date: { min: number; max: number };
  movie_status: Status[];
  movie_rating: { min: number; max: number };
  movie_votes: { min: number; max: number };
}
export interface MovieTagOptions {
  includeWatched: boolean;
  tagsRequired: string[];
  tagsBlacklist: string[];
  tagsOptional: string[];
}
export interface TagRelationshipOptions {
  user_tag_rating: { min: number; max: number };
  user_tag_frequency: { min: number; max: number };
  useUserAvgRating: boolean;
}

type CrewJob =
  | "Director"
  | "Screenplay"
  | "Writer"
  | "Director of Photography"
  | "Original Music Composer"
  | "Editor"
  | "Art Direction"
  | "Music"
  | "Story"
  | "Costume Design"
  | "Novel"
  | "Production Design"
  | "Executive Producer"
  | "Animation";
export interface MovieTagRelationshipOptions {
  cast_order: number;
  crew_job: CrewJob[];
}
export interface MovieFilterParameters {
  isAdult?: boolean;
  title?: string;
  releaseDate?: { min: number; max: number };
  runtime?: { min: number; max: number };
  status?:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";
  avgRating?: { min: number; max: number };
  numVotes?: { min: number; max: number };
  popularity?: { min: number; max: number };
  tagBlacklist?: string[];
  tagRequired?: string[];
  tagOptional?: string[];
}

export interface PageOptions {
  order_by:
    | "title"
    | "popularity"
    | "release_date"
    | "runtime"
    | "vote_average"
    | "vote_count";
  order_by_dir: "asc" | "desc";
  page: number;
  per_page: number;
}

export interface MovieJSON {
  adult: boolean | null;
  backdrop_path: string | null;
  belongs_to_collection: number | null;
  budget: number;
  homepage: string | null;
  imdb_link: string;
  letterboxd_link: string | null;
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
  status:
    | "Rumored"
    | "Planned"
    | "In Production"
    | "Post Production"
    | "Released"
    | "Canceled";
  tagline: string | null;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface RecommendContentMovie {
  similarity: number;
  details: MovieJSON;
  tags: string[];
  common: string[];
}

export interface RecommendMovieResponse {
  movies: RecommendContentMovie[];
}

export interface ContentRecommendQuery {
  user_tag_rating_min?: string;
  user_tag_frequency_min?: string;
  useUserAvgRating?: string;
  tag_popularity_min?: string;
  tag_popularity_max?: string;
  ignore_tags?: string | string[];
  tag_labels?: TagLabel | TagLabel[];
  tag_department_labels?: string | string[];
  tag_idf_min?: string;
  tag_idf_max?: string;
  movie_popularity_min?: string;
  movie_popularity_max?: string;
  movie_runtime_min?: string;
  movie_runtime_max?: string;
  movie_release_date_min?: string;
  movie_release_date_max?: string;
  movie_status?: Status | Status[];
  movie_rating_min?: string;
  movie_rating_max?: string;
  movie_votes_min?: string;
  movie_votes_max?: string;
  includeWatched?: string;
  tagsRequired?: string | string[];
  tagsBlacklist?: string | string[];
  tagsOptional?: string | string[];
  tagsInCommon?: string;
  order_by?:
    | "title"
    | "popularity"
    | "release_date"
    | "runtime"
    | "vote_average"
    | "vote_count";
  order_by_dir?: "asc" | "desc";
  page?: string;
  per_page?: string;
}
export interface ContentRecommendFilters {
  user_tag_rating_min: number;
  user_tag_frequency_min: number;
  useUserAvgRating: boolean;
  tag_popularity_min: number;
  tag_popularity_max: number;
  ignore_tags: string[];
  tag_labels: TagLabel[];
  tag_department_labels: string[];
  tag_idf_min: number;
  tag_idf_max: number;
  movie_popularity_min: number;
  movie_popularity_max: number;
  movie_runtime_min: number;
  movie_runtime_max: number;
  movie_release_date_min: number;
  movie_release_date_max: number;
  movie_status: Status[];
  movie_rating_min: number;
  movie_rating_max: number;
  movie_votes_min: number;
  movie_votes_max: number;
  includeWatched: boolean;
  tagsRequired: string[];
  tagsBlacklist: string[];
  tagsOptional: string[];
  tagsInCommon: number;
  order_by:
    | "title"
    | "popularity"
    | "release_date"
    | "runtime"
    | "vote_average"
    | "vote_count";
  order_by_dir: "asc" | "desc";
  page: number;
  per_page: number;
}
