import User from "../models/user";
import Movie from "../models/movie";
import { FilterParams, Movie as MovieInterface } from "./types";

const format_movies = (movies: MovieInterface[]) => {
	return movies.map((movie) => {
		return {
			...movie,
			tags: movie.tags.map((tag) => tag.term) as string[],
			score: movie.score.score,
			maxTag: movie.score.maxTag,
			userRating: movie.score.userRating
		};
	});
};

const get_user_movie_ids = async (username: string) => {
	let user_movie_ids;

	try {
		user_movie_ids = await User.aggregate([
			{
				$match: {
					_id: username
				}
			},
			{
				$project: {
					movies: {
						$map: {
							input: "$movies",
							as: "el",
							in: "$$el._id"
						}
					}
				}
			}
		]);

		user_movie_ids = user_movie_ids[0].movies;
	} catch (err) {
		console.error(err);
		user_movie_ids = [];
	}
	return user_movie_ids;
};

const get_recommendations = async (
	username: string,
	user_movie_ids: number[],
	filterParams: FilterParams,
	sort_by: string
) => {
	const {
		filter,
		min_vote_average,
		min_runtime,
		min_vote_count,
		num_per_page,
		page
	} = filterParams;

	const match_expr = [
		{
			$in: [username, "$score._id"]
		},

		{
			$gte: ["$vote_count", min_vote_count]
		},
		{
			$gte: ["$runtime", min_runtime]
		},
		{
			$gte: ["$vote_average", min_vote_average]
		},
		{
			$not: [{ $in: ["$_id", user_movie_ids] }]
		}
	];
	if (filter) {
		match_expr.push({
			$in: [filter, "$filter"]
		});
	}

	try {
		const data = await Movie.aggregate([
			{
				$match: {
					$expr: {
						$and: match_expr
					}
				}
			},
			{
				$addFields: {
					score: {
						$filter: {
							input: "$score",
							as: "el",
							cond: {
								$eq: ["$$el._id", username]
							}
						}
					}
				}
			},
			{
				$set: {
					score: {
						$arrayElemAt: ["$score", 0]
					}
				}
			},
			{
				$match: {
					$expr: {
						$ne: ["$score.score", 0]
					}
				}
			},

			{
				$sort: sort_by
			},
			{
				$skip: (page - 1) * num_per_page
			},
			{
				$limit: num_per_page
			}
			// {
			// 	$facet: {
			// 		metadata: [{ $count: "total" }],
			// 		data: [
			// 			{
			// 				$skip: (page - 1) * num_per_page
			// 			},
			// 			{
			// 				$limit: num_per_page
			// 			}
			// 		]
			// 	}
			// }
		]).allowDiskUse(true);
		const total = await Movie.countDocuments({
			$expr: {
				$and: match_expr
			},
			score: {
				$elemMatch: { _id: username, score: { $gt: 0 } }
			}
		});
		// const total = data[0].metadata[0].total;
		let recommendations = format_movies(data);
		const total_pages = Math.ceil(total / num_per_page);
		return [recommendations, total, total_pages];
	} catch (err) {
		console.error(err);
		let total = 0;
		const total_pages = Math.ceil(total / num_per_page);
		return [[], total, total_pages];
	}
};

const get_user_movies = async (
	username: string,
	user_movie_ids: number[],
	filterParams: FilterParams,
	sort_by: string
) => {
	const {
		filter,
		min_vote_average,
		min_runtime,
		min_vote_count,
		num_per_page,
		page
	} = filterParams;

	const match_expr = [
		{
			$in: [username, "$score._id"]
		},
		{
			$gte: ["$vote_count", min_vote_count]
		},
		{
			$gte: ["$runtime", min_runtime]
		},
		{
			$gte: ["$vote_average", min_vote_average]
		},
		{
			$in: ["$_id", user_movie_ids]
		}
	];

	if (filter) {
		match_expr.push({
			$in: [filter, "$filter"]
		});
	}
	try {
		const db_response = await Movie.aggregate([
			{
				$match: {
					$expr: {
						$and: match_expr
					}
				}
			},
			{
				$addFields: {
					score: {
						$filter: {
							input: "$score",
							as: "el",
							cond: {
								$eq: ["$$el._id", username]
							}
						}
					}
				}
			},
			{
				$set: {
					score: {
						$arrayElemAt: ["$score", 0]
					}
				}
			},
			{
				$lookup: {
					from: "users",
					let: {
						movie_id: "$_id",
						user_id: "$score._id"
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$$user_id", "$_id"]
								}
							}
						},
						{
							$unwind: {
								path: "$movies"
							}
						},
						{
							$match: {
								$expr: {
									$eq: ["$$movie_id", "$movies._id"]
								}
							}
						},
						{
							$project: {
								"movies.rating": 1
							}
						},
						{
							$set: {
								rating: "$movies.rating"
							}
						},
						{
							$unset: ["movies"]
						}
					],
					as: "score.userRating"
				}
			},
			{
				$set: {
					"score.userRating": {
						$arrayElemAt: ["$score.userRating", 0]
					}
				}
			},
			{
				$set: {
					"score.userRating": "$score.userRating.rating"
				}
			},
			{
				$sort: sort_by
			},
			{
				$facet: {
					metadata: [{ $count: "total" }],
					data: [
						{
							$skip: (page - 1) * num_per_page
						},
						{
							$limit: num_per_page
						}
					]
				}
			}
		]).allowDiskUse(true);
		const { metadata, data } = db_response[0];
		const total = metadata[0].total;
		let user_movies = format_movies(data);
		const total_pages = Math.ceil(total / num_per_page);
		return [user_movies, total, total_pages];
	} catch (err) {
		console.error(err);

		let total = 0;
		const total_pages = Math.ceil(total / num_per_page);
		return [[], total, total_pages];
	}
};

module.exports = { get_user_movie_ids, get_recommendations, get_user_movies };
