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

router.get("/:username/personal", async (req, res) => {
	let username = req.params.username;
	let filter = req.query.tag;
	let sort = req.query.sort || "order.score";

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
		recommendations = await Movie.aggregate([
			{
				$match: {
					$expr: {
						$and: [
							{
								$in: ["$_id", usermovies]
							}
						]
					}
				}
			},
			{
				$addFields: {
					order: {
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
				$sort: {
					"order.score": -1
				}
			}
		]);
	} catch (err) {
		console.log(err);
		return res.redirect("/");
	}

	recommendations = recommendations.map((movie) => {
		return {
			...movie,
			tags: movie.tags.map((tag) => tag.term),
			score: movie.score.filter((user) => user._id === username)[0].score
		};
	});
	await scrapeThumbnails(recommendations);

	res.render("pages/personal", {
		data: recommendations,
		search: filter,
		username: username
	});
});

router.get("/:username", async (req, res) => {
	// let filtered_database = await Movie.find({});

	// let id = parseInt(req.query.id);
	// let user_movies = require("../json/users/ropeiscut-movies.json").movies;
	// user_movies = merge_movies(filtered_database, user_movies);

	// let ref_tags = await gen_ref_tags(user_movies);

	// // ref_tags = gen_ref_tags(filtered_database);
	// let count_books_tag = await get_tag_count(
	// 	filtered_database,
	// 	ref_tags,
	// 	"database"
	// );
	// // filter using tfidf score somehow
	// [ref_tags, count_books_tag] = filter_tags(ref_tags, count_books_tag);

	// let database_TF_IDF_Vectors = await get_TF_IDF_Vectors(
	// 	filtered_database,
	// 	ref_tags,
	// 	count_books_tag,
	// 	"database_TFIDF"
	// );

	// // apply movie rating to each movie vector
	// for (let i = 0; i < database_TF_IDF_Vectors.length; i++) {
	// 	const vector = database_TF_IDF_Vectors[i];
	// 	let rating = filtered_database[i].vote_average;
	// 	database_TF_IDF_Vectors[i] = math.multiply(vector, rating);
	// 	const [maxIndex, maxValue] = indexOfMax(vector);
	// 	filtered_database[i].maxTag = ref_tags[maxIndex];
	// 	let a = [];
	// 	// for (let j = 0; j < filtered_database[i].tags.length; j++) {
	// 	// 	const tag = filtered_database[i].tags[j];
	// 	// 	const tagIndex = ref_tags.indexOf(tag);
	// 	// 	const tagScore = vector[tagIndex];
	// 	// 	a.push({ tag, tagScore });
	// 	// }
	// 	// console.log("");
	// }

	// let search_vector;
	// let search_vector_name;
	// if (id) {
	// 	search_vector_name = "id";
	// 	for (let i = 0; i < filtered_database.length; i++) {
	// 		const book = filtered_database[i];
	// 		if (book.id == id) {
	// 			search_vector = database_TF_IDF_Vectors[i];
	// 			break;
	// 		}
	// 	}
	// } else {
	// 	search_vector_name = "user";
	// 	count_books_tag = await get_tag_count(user_movies, ref_tags, "user");

	// 	let user_TF_IDF_Vectors = await get_TF_IDF_Vectors(
	// 		user_movies,
	// 		ref_tags,
	// 		count_books_tag,
	// 		"user_TFIDF"
	// 	);
	// 	const movies_w_rating = user_movies.filter(
	// 		(movie) => !isNaN(movie.user_rating)
	// 	);
	// 	const movies_ratings = movies_w_rating.map(
	// 		(movie) => movie.user_rating
	// 	);
	// 	const avg_user_rating = math.mean(movies_ratings);

	// 	user_movies.forEach((movie) => {
	// 		if (isNaN(movie.user_rating)) {
	// 			movie.user_rating = 1;
	// 		}
	// 	});

	// 	for (let i = 0; i < user_TF_IDF_Vectors.length; i++) {
	// 		const vector = user_TF_IDF_Vectors[i];
	// 		const rating = user_movies[i].user_rating;
	// 		user_TF_IDF_Vectors[i] = math.multiply(vector, rating);
	// 	}

	// 	search_vector = math.multiply(
	// 		math.apply(user_TF_IDF_Vectors, 0, math.sum),
	// 		1 / user_TF_IDF_Vectors.length
	// 	);
	// 	let v = [];
	// 	for (let i = 0; i < search_vector.length; i++) {
	// 		const el = search_vector[i];
	// 		v.push({ tag: ref_tags[i], score: el });
	// 	}
	// 	v = v.sort((a, b) => a.score - b.score);
	// 	// print("");
	// }

	// let recommended_list = await get_recommended(
	// 	search_vector,
	// 	database_TF_IDF_Vectors,
	// 	filtered_database,
	// 	search_vector_name
	// );
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

	let filter = req.query.tag;
	let min_vote_count = parseInt(req.query.min_vote_count) || 1000;
	let min_vote_average = parseInt(req.query.min_vote_average) || 6;
	let min_runtime = parseInt(req.query.min_runtime) || 60;
	let page = parseInt(req.query.page) || 0;
	let num_per_page = parseInt(req.query.num_per_page) || 25;
	let filter_list = [];
	filter ? (filter_list = [filter]) : (filter_list = []);
	// {
	// 	$not: [{ $in: ["$_id", usermovies] }];
	// }
	// let filtered_movies = MOVIES.filter((movie) => {
	// 	const { _id, vote_count, vote_average, runtime, tags } = movie;
	// 	return (
	// 		vote_count >= 1000 &&
	// 		runtime >= 60 &&
	// 		vote_average >= 6 &&
	// 		!usermovies.includes(_id)
	// 	);
	// });

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
									$in: [filter, "$filter"]
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
						order: {
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
					$sort: {
						"order.score": -1
					}
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
						order: {
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
					$sort: {
						"order.score": -1
					}
				},
				{
					$skip: page * 100
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

	// let recommended_list = await Movie.aggregate([
	// 	{
	// 		$match: {
	// 			$expr: {
	// 				$and: [
	// 					{
	// 						$gte: ["$vote_count", 1000]
	// 					},
	// 					{
	// 						$gte: ["$runtime", 60]
	// 					},
	// 					{
	// 						$gte: ["$vote_average", 6]
	// 					},
	// 					{
	// 						$not: [{ $in: ["$_id", usermovies] }]
	// 					}
	// 				]
	// 			}
	// 		}
	// 	},
	// 	{
	// 		$lookup: {
	// 			from: "users",
	// 			let: {
	// 				username: "ropeiscut",
	// 				movie_id: "$_id"
	// 			},
	// 			pipeline: [
	// 				{
	// 					$match: {
	// 						$expr: {
	// 							$and: [
	// 								{
	// 									$eq: ["$$username", "$_id"]
	// 								}
	// 							]
	// 						}
	// 					}
	// 				},
	// 				{
	// 					$project: {
	// 						recommended: {
	// 							$filter: {
	// 								input: "$recommended",
	// 								as: "el",
	// 								cond: {
	// 									$eq: ["$$el._id", "$$movie_id"]
	// 								}
	// 							}
	// 						}
	// 					}
	// 				},
	// 				{
	// 					$set: {
	// 						recommended: {
	// 							$arrayElemAt: ["$recommended", 0]
	// 						}
	// 					}
	// 				}
	// 			],
	// 			as: "score"
	// 		}
	// 	},
	// 	{
	// 		$set: {
	// 			score: {
	// 				$arrayElemAt: ["$score", 0]
	// 			}
	// 		}
	// 	},
	// 	{
	// 		$set: {
	// 			score: "$score.recommended.score"
	// 		}
	// 	}
	// 	// {
	// 	// 	$match: {
	// 	// 		score: {
	// 	// 			$gt: 0
	// 	// 		}
	// 	// 	}
	// 	// }
	// 	// {
	// 	// 	$sort: {
	// 	// 		score: -1
	// 	// 	}
	// 	// },
	// 	// {
	// 	// 	$limit: 1000
	// 	// }
	// ]).allowDiskUse(true);

	// recommended_list = recommended_list.sort((a, b) => b.score - a.score);
	recommendations = recommendations.map((movie) => {
		return {
			...movie,
			tags: movie.tags.map((tag) => tag.term),
			score: movie.score.filter((user) => user._id === username)[0].score
		};
	});
	// if (search_list.length !== 0) {
	// 	recommended_list = recommended_list.filter((movie) =>
	// 		movie.tags.some((r) => search_list.includes(r))
	// 	);
	// }
	// recommendations.forEach((movie) => {
	// 	let { score, tags } = movie;
	// 	score = score[0].score;
	// 	tags = tags.map((tag) => tag.term);
	// });

	await scrapeThumbnails(recommendations);

	res.render("pages/recommended", {
		data: recommendations,
		search: filter,
		username: username,
		page: page
	});
});
router.get("/:username/update", async (req, res) => {
	const username = req.params.username;
	let usermovies = await User.findById(username).lean();

	// try {
	// 	usermovies = require(`../json/users/${username}-movies.json`).movies;
	// } catch (err) {
	// 	console.log(err);
	// 	return res.redirect(`/${username}/letterboxd`);
	// }

	if (usermovies === null && username !== "") {
		const newUser = {
			_id: username,
			movies: [],
			recommended: []
		};
		const userToSave = new User(newUser);
		try {
			await userToSave.save();
			await Movie.updateMany(
				{},
				{
					$addToSet: {
						score: {
							_id: username,
							score: 0
						}
					}
				}
			);
			return res.redirect(`/${username}/letterboxd`);
		} catch (err) {
			console.error("Unable to save user to database");
			return res.status(500).send(err);
		}
	}

	// const newUser = {
	// 	_id: username,
	// 	movies: [],
	// 	recommended: []
	// };
	// let ratings = usermovies.map((movie) => movie.rating);
	// ratings = ratings.filter((rating) => rating !== null);
	// let avg = math.mean(ratings);
	// usermovies.forEach((movie) => {
	// 	const movieObj = {
	// 		_id: parseInt(movie.id),
	// 		rating: movie.rating || avg
	// 	};
	// 	if (!isNaN(movieObj._id)) {
	// 		newUser.movies.push(movieObj);
	// 	}
	// });
	// if (usermovies) {
	// 	await User.updateOne({ _id: username }, newUser);
	// } else {
	// }

	let tags = await User.aggregate([
		{
			$match: {
				_id: username
			}
		},
		{
			$project: {
				movies: 1
			}
		},
		{
			$unwind: {
				path: "$movies"
			}
		},
		{
			$lookup: {
				from: "movies",
				localField: "movies._id",
				foreignField: "_id",
				as: "movies"
			}
		},
		{
			$match: {
				$expr: {
					$not: {
						$eq: [
							{
								$size: "$movies"
							},
							0
						]
					}
				}
			}
		},
		{
			$set: {
				movies: {
					$arrayElemAt: ["$movies", 0]
				}
			}
		},
		{
			$set: {
				movies: {
					$map: {
						input: "$movies.tags",
						as: "el",
						in: {
							_id: "$$el._id",
							count: "$$el.count",
							idf: "$$el.idf"
						}
					}
				}
			}
		},
		{
			$unwind: {
				path: "$movies"
			}
		},
		{
			$group: {
				_id: "$_id",
				tags: {
					$addToSet: "$movies"
				}
			}
		}
	]);
	tags = tags[0].tags;
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
		tagsObj.set(tag._id, i);
	});
	// tags = tags.map((tag, i) => {
	// 	return { ...tag, index: i };
	// });

	const movies = req.app.get("MOVIES");

	let usermoviesratings = usermovies.movies.map((movie) => movie.rating);
	let avg_user_movie_rating = math.mean(usermoviesratings);
	let usermovieids = usermovies.movies.map((movie) => movie._id);

	let fullusermovies = movies.filter((movie) =>
		usermovieids.includes(movie._id)
	);
	let usermovieMap = new Map();
	usermovies.movies.forEach((movie) => {
		usermovieMap.set(movie._id, movie.rating);
	});
	usermovies = fullusermovies.map((movie) => {
		return { ...movie, userRating: usermovieMap.get(movie._id) };
	});

	// add user rating to movies object
	let alluservectors = [];
	for (let i = 0; i < usermovies.length; i++) {
		const movie = usermovies[i];
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
		let movieVector = math.matrix(math.zeros([1, tags.length]), "sparse");
		movie.tags.forEach((tag) => {
			const index = tagsObj.get(tag._id);
			if (index !== undefined) {
				// avg_user_movie_rating
				let tfidf = tag.idf;
				let ratingWeight = Math.pow(
					movie.userRating / avg_user_movie_rating,
					3
				);
				movieVector.set(
					[0, index],
					(tfidf - avg_tags_idf) * ratingWeight
				);
			}
		});
		alluservectors.push(movieVector);
	}
	let search_vector = math.multiply(
		math.apply(alluservectors, 0, math.sum),
		1 / alluservectors.length
	);

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
	let recommendedMovies = [];
	for (let i = 0; i < movies.length; i++) {
		const movie = movies[i];
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
		let movieVector = math.matrix(math.zeros([1, tags.length]), "sparse");
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
					3
				);

				movieVector.set(
					[0, index],
					(tfidf - avg_tags_idf) * ratingWeight
				);
			}
		});
		let score = cosine_similarity(search_vector, movieVector);
		recommendedMovies.push({ _id: movie._id, score: score });
		await Movie.updateOne(
			{ _id: movie._id, "score._id": username },
			{ "score.$.score": score }
		);
		if (i % 1000 == 0) {
			console.log(`${i}/${movies.length}`);
		}
	}
	await User.updateOne(
		{ _id: username },
		{ $set: { recommended: recommendedMovies } }
	);
	recommendedMovies = recommendedMovies.sort((a, b) => b.score - a.score);
	res.redirect(`/${username}`);
	// movieVector = movieVector.toArray();
});
router.get("/movie/:id", async (req, res) => {
	const id = req.params.id;
	let page = parseInt(req.query.page) || 0;
	let num_per_page = parseInt(req.query.num_per_page) || 25;

	let movie = await Movie.findById(id).lean();
	let tags = movie.tags.map((tag) => tag._id);
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

	const movies = req.app.get("MOVIES");

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

			search_vector.set([0, index], tfidf - avg_tags_idf);
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
					3
				);
				movieVector.set(
					[0, index],
					(tfidf - avg_tags_idf) * ratingWeight
				);
			}
		});
		let score = cosine_similarity(search_vector, movieVector);
		recommendations.push({ ...movie, score: score });

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
		search: movie.title,
		id: id,
		page: page
	});
	// movieVector = movieVector.toArray();
});
module.exports = router;
