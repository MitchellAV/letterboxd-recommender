const express = require("express");
const fs = require("fs");

const router = express.Router();
const math = require("mathjs");
const Movie = require("../models/movie");
const Tag = require("../models/tag");
const User = require("../models/user");

const merge_movies = (filtered_database, user_movies) => {
	const movies = [];
	for (let i = 0; i < filtered_database.length; i++) {
		const movie = filtered_database[i];
		for (let j = 0; j < user_movies.length; j++) {
			const user_movie = user_movies[j];
			if (movie.id == parseInt(user_movie.id)) {
				movie.user_rating = parseInt(user_movie.rating);
				movies.push(movie);
				break;
			}
		}
	}
	return movies;
};
const merge_movies_keywords = (filtered_database, user_movies) => {
	const filtered_database_length = filtered_database.length;

	for (let i = 0; i < filtered_database_length; i++) {
		const movie = filtered_database[i];
		const user_movie = user_movies.find((e) => parseInt(e.id) == movie.id);
		if (user_movie) {
			user_movie.keywords = [...movie.keywords];
			user_movie.tags = [...user_movie.tags, ...movie.keywords];
		}

		if (i % 1000 == 0) {
			console.log(`Merged ${i + 1}/${filtered_database_length}`);
		}
	}
};
const merge_movies_credits = (filtered_database, user_movies) => {
	const filtered_database_length = filtered_database.length;
	for (let i = 0; i < filtered_database_length; i++) {
		const movie = filtered_database[i];
		const user_movie = user_movies.find((e) => parseInt(e.id) == movie.id);
		if (user_movie) {
			user_movie.cast = [...movie.cast];
			user_movie.crew = [...movie.crew];
			user_movie.tags = [
				...user_movie.tags,
				...movie.cast,
				...movie.crew
			];
		}

		if (i % 1000 == 0) {
			console.log(`Merged ${i + 1}/${filtered_database_length}`);
		}
	}
};

const {
	cleanDatabase,
	cleanDatabaseKeywords,
	cleanDatabaseCredits
} = require("../filter");
const {
	filter_recommended,
	get_recommended,
	get_TF_IDF_Vectors,
	gen_ref_tags,
	get_tag_count,
	scrapeThumbnails,
	get_database,
	cosine_similarity
} = require("../recommendation_engine.js");

let overwrite = true;
if (!overwrite) {
	// filtered_database = [...get_database(0, Infinity, "./json/filtered/")];
	// const first = { ...filtered_database[0] };
	// const movie = new Movie(first);
	// movie
	// 	.save()
	// 	.then((result) => console.log("saved movie"))
	// 	.catch((err) => console.error(err));
} else {
	// filtered_database = [...get_database(0, Infinity, "./json/database/")];
	// let filtered_database_keywords = [
	// 	...get_database(0, Infinity, "./json/keywords/")
	// ];
	// let filtered_database_credits = [
	// 	...get_database(0, Infinity, "./json/credits/")
	// ];
	// filtered_database = cleanDatabase(filtered_database);
	// console.log("created filtered database");
	// filtered_database.forEach((movie) => {
	// const movieBSON = new Movie({ ...movie, _id: movie.id });
	// console.log(`${movie.id}`);
	// movieBSON
	// 	.save()
	// 	.then((result) => console.log(`${movie.id} added to Database`));
	// 		.catch((err) => console.error(err));
	// });
	// filtered_database_keywords = cleanDatabaseKeywords(
	// 	filtered_database_keywords
	// );
	// console.log("created filtered database");
	// filtered_database_credits = cleanDatabaseCredits(filtered_database_credits);
	// console.log("created filtered database");
	// merge_movies_keywords(filtered_database_keywords, filtered_database);
	// merge_movies_credits(filtered_database_credits, filtered_database);
	// filtered_database_keywords = [];
	// filtered_database_credits = [];
	// let json = { posts: [] };
	// let page = 0;
	// let itemsPerPage = 1000;
	// for (let i = 0; i < filtered_database.length; i++) {
	// 	const movie = filtered_database[i];
	// 	json.posts.push(movie);
	// 	if (
	// 		json.posts.length == itemsPerPage ||
	// 		i == filtered_database.length - 1
	// 	) {
	// 		fs.writeFileSync(
	// 			`./json/filtered/${page}-${itemsPerPage}-tmdb.json`,
	// 			JSON.stringify(json)
	// 		);
	// 		page++;
	// 		json = { posts: [] };
	// 	}
	// }
}
function indexOfMax(arr) {
	if (arr.length === 0) {
		return -1;
	}

	var max = arr[0];
	var maxIndex = 0;

	for (var i = 1; i < arr.length; i++) {
		if (arr[i] > max) {
			maxIndex = i;
			max = arr[i];
		}
	}

	return [maxIndex, max];
}
const filter_tags = (ref_tags, count_books_tag) => {
	let c = [];
	for (let i = 0; i < ref_tags.length; i++) {
		const tag = ref_tags[i];
		const count = count_books_tag[i];
		c.push({ tag, count });
	}
	const low = 200;
	c = c.filter((movie) => {
		return movie.count > low;
	});
	// count_books_tag = count_books_tag.sort((a, b) => a - b);
	// count_books_tag = c.map((movie) => movie.count);
	// const median = math.median(count_books_tag);
	// c = c.filter((movie) => {
	// 	return movie.count > median;
	// });
	// count_books_tag = c.map((movie) => movie.count);
	const avg_tag_count = math.mean(count_books_tag);
	const std_tag_count = math.std(count_books_tag);
	const max = math.max(count_books_tag);
	const min = math.min(count_books_tag);
	const mode = math.mode(count_books_tag);
	const high = avg_tag_count + 1.96 * std_tag_count;
	c = c.filter((movie) => {
		return movie.count < high;
	});
	c = c.sort((a, b) => b.count - a.count);
	// c = c.slice(0, 100);
	count_books_tag = c.map((movie) => movie.count);
	ref_tags = c.map((movie) => movie.tag);
	return [ref_tags, count_books_tag];
};

const tagBlacklist = ["aftercreditsstinger", "duringcreditsstinger"];
const default_min_vote_count = 100;
const default_min_vote_average = 6;
const default_min_runtime = 40;
const default_num_per_page = 25;
const default_sort_type = "score.score";
const default_order = -1;

router.get("/:username/personal", async (req, res) => {
	const username = req.params.username;
	const qIndex = req.url.indexOf("?");
	let queryString;
	if (qIndex !== -1) {
		queryString = req.url.substr(qIndex);
	} else {
		queryString = "";
	}
	queryString = queryString.replace(/[&?]page=\d+/g, "");
	let filter = req.query.filter;
	let min_vote_count =
		parseInt(req.query.min_vote_count) || default_min_vote_count;
	let min_vote_average =
		parseFloat(req.query.min_vote_average) || default_min_vote_average;
	let min_runtime = parseInt(req.query.min_runtime) || default_min_runtime;
	let page = parseInt(req.query.page) || 0;
	let num_per_page = parseInt(req.query.num_per_page) || default_num_per_page;
	let sort_type = req.query.sort_type || default_sort_type;
	let order = parseInt(req.query.order) || default_order;

	let sort_by;
	if (sort_type !== "score.score") {
		sort_by = { [sort_type]: order, "score.score": -1 };
	} else {
		sort_by = { [sort_type]: order };
	}

	let usermovies;
	try {
		usermovies = await User.aggregate([
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
		if (usermovies.length === 0) {
			throw new Error("no account found");
		}
		usermovies = usermovies[0].movies;
	} catch (err) {
		console.log(err);
		return res.redirect("/");
	}
	let recommendations;
	try {
		if (filter) {
			recommendations = await Movie.aggregate([
				{
					$match: {
						$expr: {
							$and: [
								{
									$in: [username, "$score._id"]
								},
								{
									$in: [filter.toLowerCase(), "$filter"]
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
									$in: ["$_id", usermovies]
								}
							]
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
					$skip: page * num_per_page
				},
				{
					$limit: num_per_page
				}
			]);
		} else {
			recommendations = await Movie.aggregate([
				{
					$match: {
						$expr: {
							$and: [
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
									$in: ["$_id", usermovies]
								}
							]
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
					$skip: page * num_per_page
				},
				{
					$limit: num_per_page
				}
			]);
		}
	} catch (err) {
		console.log(err);
		return res.redirect(`/${username}`);
	}

	recommendations = recommendations.map((movie) => {
		return {
			...movie,
			tags: movie.tags.map((tag) => tag.term),
			score: movie.score.score,
			maxTag: movie.score.maxTag,
			userRating: movie.score.userRating
		};
	});
	await scrapeThumbnails(recommendations);
	let url =
		req.url.indexOf("?") !== -1
			? req.url.slice(0, req.url.indexOf("?"))
			: req.url;
	res.render("pages/personal", {
		data: recommendations,
		search: filter,
		username: username,
		page: page,
		queryString: queryString,
		url: url,
		filterParams: {
			filter,
			min_vote_count,
			min_vote_average,
			min_runtime,
			num_per_page,
			sort_type,
			order
		}
	});
});

router.get("/:username", async (req, res) => {
	const username = req.params.username;
	let usermovies;
	try {
		usermovies = await User.aggregate([
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
		if (usermovies.length === 0) {
			throw new Error("no account found");
		}
		usermovies = usermovies[0].movies;
	} catch (err) {
		console.log(err);
		return res.redirect("/");
	}
	const qIndex = req.url.indexOf("?");
	let queryString;
	if (qIndex !== -1) {
		queryString = req.url.substr(qIndex);
	} else {
		queryString = "";
	}
	queryString = queryString.replace(/[&?]page=\d+/g, "");

	let filter = req.query.filter;
	let min_vote_count =
		parseInt(req.query.min_vote_count) || default_min_vote_count;
	let min_vote_average =
		parseFloat(req.query.min_vote_average) || default_min_vote_average;
	let min_runtime = parseInt(req.query.min_runtime) || default_min_runtime;
	let page = parseInt(req.query.page) || 0;
	let num_per_page = parseInt(req.query.num_per_page) || default_num_per_page;
	let sort_type = req.query.sort_type || default_sort_type;
	let order = parseInt(req.query.order) || default_order;

	let recommendations;
	let sort_by;
	if (sort_type !== "score.score") {
		sort_by = { [sort_type]: order, "score.score": -1 };
	} else {
		sort_by = { [sort_type]: order };
	}

	try {
		if (filter) {
			recommendations = await Movie.aggregate([
				{
					$match: {
						$expr: {
							$and: [
								{
									$in: [username, "$score._id"]
								},
								{
									$in: [filter.toLowerCase(), "$filter"]
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
									$not: [{ $in: ["$_id", usermovies] }]
								}
							]
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
					$sort: sort_by
				},
				{
					$skip: page * num_per_page
				},
				{
					$limit: num_per_page
				}
			]);
		} else {
			recommendations = await Movie.aggregate([
				{
					$match: {
						$expr: {
							$and: [
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
									$not: [{ $in: ["$_id", usermovies] }]
								}
							]
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
					$sort: sort_by
				},
				{
					$skip: page * num_per_page
				},
				{
					$limit: num_per_page
				}
			]);
		}
	} catch (err) {
		console.log(err);
		return res.redirect("/");
	}

	recommendations = recommendations.map((movie) => {
		return {
			...movie,
			tags: movie.tags.map((tag) => tag.term),
			score: movie.score.score,
			maxTag: movie.score.maxTag,
			userRating: movie.score.userRating
		};
	});

	await scrapeThumbnails(recommendations);
	let url =
		req.url.indexOf("?") !== -1
			? req.url.slice(0, req.url.indexOf("?"))
			: req.url;
	res.render("pages/recommended", {
		data: recommendations,
		search: filter,
		username: username,
		page: page,
		queryString: queryString,
		url: url,

		filterParams: {
			filter,
			min_vote_count,
			min_vote_average,
			min_runtime,
			num_per_page,
			sort_type,
			order
		}
	});
});

router.get("/movie/:id", async (req, res) => {
	const id = req.params.id;
	const qIndex = req.url.indexOf("?");
	let queryString;
	if (qIndex !== -1) {
		queryString = req.url.substr(qIndex);
	} else {
		queryString = "";
	}

	queryString = queryString.replace(/[&?]page=\d+/g, "");

	let filter = req.query.filter;
	let min_vote_count = parseInt(req.query.min_vote_count) || 1000;
	let min_vote_average = parseInt(req.query.min_vote_average) || 6;
	let min_runtime = parseInt(req.query.min_runtime) || 40;
	let page = parseInt(req.query.page) || 0;
	let num_per_page = parseInt(req.query.num_per_page) || 20;

	const movie = await Movie.findById(id).lean();
	const movies = req.app.get("MOVIES");

	let tags = movie.tags.filter(
		(tag) => (tag.count / movies.length) * 100 <= 10
	);

	tags = tags.filter((tag) => !tagBlacklist.includes(tag._id));
	tags = tags.map((tag) => tag._id);
	// let idf = tags.map((tag) => tag.idf);
	// const max = math.max(idf);
	// const min = math.min(idf);
	// const mid = min + (max - min) / 2;
	// const lower = min + (mid - min) / 2;
	// const upper = max - (max - mid) / 2;
	// tags = tags.sort((a, b) => a.idf - b.idf);
	// tags = tags.filter((tag) => tag.idf < upper);
	// tags = tags.filter((tag) => tag.idf > lower);
	let tagsObj = new Map();
	tags.forEach((tag, i) => {
		tagsObj.set(tag, i);
	});
	// tags = tags.map((tag, i) => {
	// 	return { ...tag, index: i };
	// });

	// add user rating to movies object
	let all_movies_average = await Movie.aggregate([
		{
			$group: {
				_id: "_id",
				average: {
					$avg: "$vote_average"
				}
			}
		}
	]);
	all_movies_average = all_movies_average[0].average;

	let search_vector = math.matrix(math.zeros([1, tags.length]), "sparse");
	let avg_tags_idf = math.mean(
		movie.tags
			.map((tag) => {
				const index = tagsObj.get(tag._id);
				if (index !== undefined) {
					return tag.idf;
				}
			})
			.filter((tag) => tag !== undefined)
	);
	movie.tags.forEach((tag) => {
		const index = tagsObj.get(tag._id);
		if (index !== undefined) {
			// avg_user_movie_rating
			let tfidf = tag.idf;

			search_vector.set([0, index], tfidf);
		}
	});

	let recommendations = [];
	for (let i = 0; i < movies.length; i++) {
		const movie = movies[i];

		let movieVector = math.matrix(math.zeros([1, tags.length]), "sparse");
		let avg_tags_idf;
		try {
			avg_tags_idf = math.mean(
				movie.tags
					.map((tag) => {
						const index = tagsObj.get(tag._id);
						if (index !== undefined) {
							return tag.idf;
						}
					})
					.filter((tag) => tag !== undefined)
			);
		} catch (err) {
			avg_tags_idf = 0;
		}
		movie.tags.forEach((tag) => {
			const index = tagsObj.get(tag._id);
			if (index !== undefined) {
				// movieavgrating
				let tfidf = tag.idf;
				let corrected_vote_average =
					(movie.vote_count * movie.vote_average +
						movie.vote_average +
						0) /
					(movie.vote_count + 2);
				let ratingWeight = Math.pow(
					corrected_vote_average / all_movies_average,
					5
				);
				movieVector.set([0, index], tfidf * ratingWeight);
			}
		});
		let { score, maxIndex } = cosine_similarity(search_vector, movieVector);
		recommendations.push({
			...movie,
			score: score,
			maxTag: tags[maxIndex]
		});

		if (i % 1000 == 0) {
			console.log(`${i}/${movies.length}`);
		}
	}

	recommendations = recommendations
		.sort((a, b) => b.score - a.score)
		.slice(page * num_per_page, page * num_per_page + num_per_page);

	await scrapeThumbnails(recommendations);

	res.render("pages/movie", {
		data: recommendations,
		search: filter,
		username: "",
		page: page,
		queryString: queryString,
		filterParams: {
			filter,
			min_vote_count,
			min_vote_average,
			min_runtime,
			num_per_page
		}
	});

	// movieVector = movieVector.toArray();
});
module.exports = router;
