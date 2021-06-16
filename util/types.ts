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
export interface Movie {
	_id: number;
	letterboxd_id?: null;
	letterboxd_url?: null;
	keywords: string[];
	tags: { term: string }[];
	genres: string[];
	cast: string[];
	crew: string[];
	directors?: string[] | null;
	producers?: string[] | null;
	writers?: null[] | null;
	dp?: string[] | null;
	screenplay?: string[] | null;
	overview_words?: string[] | null;
	production_countries?: string[] | null;
	production_companies?: string[] | null;
	spoken_languages?: string[] | null;
	title?: string;
	vote_count?: number;
	vote_average?: number;
	release_date?: string;
	runtime?: number;
	revenue?: number;
	overview?: string;
	original_title?: string;
	original_language?: string;
	imdb_id?: string;
	budget?: number;
	adult?: boolean;
	thumbnail_url?: string;
	score: ScoreEntity;
	createdAt: CreatedAtOrUpdatedAt;
	updatedAt: CreatedAtOrUpdatedAt;
	filter?: string[] | null;
	adjusted_rating?: number;
}
export interface ScoreEntity {
	_id: string;
	score: number;
	maxTag: string;
	userRating: number;
}
export interface CreatedAtOrUpdatedAt {
	$date: string;
}

export interface Response {
	message: string;
	status: number;
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
