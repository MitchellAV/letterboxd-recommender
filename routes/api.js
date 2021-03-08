const express = require("express");
const { body, validationResult } = require("express-validator");
const router = express.Router();
const math = require("mathjs");
const Movie = require("../models/movie");
const User = require("../models/user");
const {
	getLetterboxdUserMovies,
	isRealLetterboxdUser
} = require("../getletterboxd");
const { cosine_similarity } = require("../recommendation_engine.js");
const tagBlacklist = [
	"aftercreditsstinger",
	"duringcreditsstinger",
	"based on novel or book",
	"woman director"
];

router.post(
	"/create_user",
	[
		body("username", "Please enter your letterboxd username.")
			.trim()
			.isLength({ min: 1 })
			.escape(),

		body(
			"accuracy",
			"Please select how accurate you want your recommendations to be."
		).isIn(["high", "med", "low"])
	],
	async (req, res) => {
		const errors = validationResult(req);
		console.log(errors);
		let data = {
			msg: "",
			errors: []
		};

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/errors messages.
			// Error messages can be returned in an array using `errors.array()`.
			console.log(errors);
			data.msg = "Please fix the following fields:";
			data.errors = errors.array();
			return res.redirect("/");
		} else {
			const username = req.body.username;
			const accuracy = req.body.accuracy;
			let usermovies;
			try {
				usermovies = await User.findById(username).lean();
			} catch (err) {
				console.log(err);
			}
			// Does user Exist in Database
			if (!usermovies) {
				// If user does not exist in database then check if username is real letterboxd user
				// if user is real get movies else dont
				let userExists = await isRealLetterboxdUser(username);

				// If check if user is real
				if (userExists) {
					const movieArray = await getLetterboxdUserMovies(username);
					// user is real
					const newUser = {
						_id: username,
						movies: [],
						watchList: [],
						following: []
					};
					if (movieArray.length !== 0) {
						let ratings = movieArray.map((movie) => movie.rating);
						ratings = ratings.filter((rating) => rating !== null);
						let avg = math.mean(ratings) || 1;
						movieArray.forEach((movie) => {
							const movieObj = {
								_id: movie._id,
								rating: movie.rating || avg
							};
							if (!isNaN(movieObj._id)) {
								newUser.movies.push(movieObj);
							}
						});
					}
					const userToSave = new User(newUser);
					try {
						// save user to database users collection
						await userToSave.save();
					} catch (err) {
						console.error("Unable to save user to database");
					}
				} else {
					console.log("user does not exist");
					return res.redirect("/");
				}
			} else {
				const movieArray = await getLetterboxdUserMovies(username);
				// user is real
				const newUser = {
					_id: username,
					movies: [],
					watchList: [],
					following: []
				};
				let ratings = movieArray.map((movie) => movie.rating);
				ratings = ratings.filter((rating) => rating !== null);
				let avg = math.mean(ratings);
				movieArray.forEach((movie) => {
					const movieObj = {
						_id: movie._id,
						rating: movie.rating || avg
					};
					if (!isNaN(movieObj._id)) {
						newUser.movies.push(movieObj);
					}
				});
				try {
					// add users movies to user in database
					await User.updateOne({ _id: username }, newUser);
				} catch (err) {
					console.error("Unable to save user to database");
				}
			}
			usermovies = await User.findById(username).lean();

			try {
				await Movie.updateMany(
					{ "score._id": { $not: { $eq: username } } },
					{
						$addToSet: {
							score: {
								_id: username,
								score: 0,
								maxTag: null,
								userRating: null
							}
						}
					}
				);
			} catch (err) {
				console.log(err);
			}
			// try {
			// const num_of_movies = await Movie.countDocuments({});
			// await Movie.aggregate([
			// 	{
			// 		$set: {
			// 			tags: {
			// 				$setUnion: [
			// 					"$keywords",
			// 					"$genres",
			// 					"$cast",
			// 					"$crew",
			// 					"$spoken_languages",
			// 					"$overview_words"
			// 				]
			// 			}
			// 		}
			// 	},
			// 	{
			// 		$unwind: {
			// 			path: "$tags"
			// 		}
			// 	},
			// 	{
			// 		$group: {
			// 			_id: "$tags",
			// 			count: {
			// 				$sum: 1
			// 			}
			// 		}
			// 	},
			// 	{
			// 		$match: {
			// 			count: {
			// 				$gt: 1
			// 			}
			// 		}
			// 	},
			// 	{
			// 		$set: {
			// 			idf: {
			// 				$log10: {
			// 					$divide: [num_of_movies, "$count"]
			// 				}
			// 			},
			// 			users: []
			// 		}
			// 	},
			// 	{
			// 		$out: "tags"
			// 	}
			// ]).allowDiskUse(true);
			// } catch (err) {
			// 	console.log(err);
			// }

			let user_movie_ids = usermovies.movies.map((movie) => movie._id);

			let user_tags = await Movie.aggregate([
				{
					$match: {
						$expr: {
							$in: ["$_id", user_movie_ids]
						}
					}
				},
				{
					$unwind: {
						path: "$tags"
					}
				},
				{
					$group: {
						_id: "$tags",
						count: {
							$sum: 1
						}
					}
				},
				{
					$set: {
						idf: {
							$log10: {
								$divide: [user_movie_ids.length, "$count"]
							}
						}
					}
				}
			]);
			let userTagMap = new Map();

			user_tags.forEach((tag) => {
				userTagMap.set(tag._id, tag.idf);
			});

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
					$lookup: {
						from: "tags",
						localField: "movies.tags",
						foreignField: "_id",
						as: "movies"
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
				},
				{
					$project: {
						"tags._id": 1,
						"tags.count": 1,
						"tags.idf": 1
					}
				}
			]);
			tags = tags[0].tags;

			const movies = req.app.get("MOVIES");
			tags = tags.sort((a, b) => b.count - a.count);
			tags = tags.filter((tag) => (tag.count / movies.length) * 100 <= 5);
			tags = tags.filter((tag) => !tagBlacklist.includes(tag._id));
			switch (accuracy) {
				case "high":
					break;
				case "med":
					tags = tags.filter(
						(tag) => (tag.count / movies.length) * 100 >= 0.5
					);
					break;
				case "low":
					tags = tags.filter(
						(tag) => (tag.count / movies.length) * 100 >= 1
					);
					break;

				default:
					break;
			}

			tags = tags.map((tag) => tag._id);

			let tagsObj = new Map();
			tags.forEach((tag, i) => {
				tagsObj.set(tag, i);
			});

			let usermoviesratings = usermovies.movies.map(
				(movie) => movie.rating
			);
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
				// let avg_tags_idf;
				// try {
				// 	avg_tags_idf = math.mean(
				// 		movie.tags
				// 			.map((tag) => {
				// 				const index = tagsObj.get(tag._id);
				// 				if (index !== undefined) {
				// 					return tag.idf;
				// 				}
				// 			})
				// 			.filter((tag) => tag !== undefined)
				// 	);
				// } catch (err) {
				// 	avg_tags_idf = 0;
				// }
				let movieVector = math.matrix(
					math.zeros([1, tags.length]),
					"sparse"
				);
				movie.tags.forEach((tag) => {
					const index = tagsObj.get(tag._id);
					if (index !== undefined) {
						// avg_user_movie_rating
						let tfidf = userTagMap.get(tag._id);
						let ratingWeight = Math.pow(
							movie.userRating / avg_user_movie_rating,
							5
						);
						movieVector.set([0, index], tfidf * ratingWeight);
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
			// let recommendedMovies = [];
			const calc_tfidf = async (
				movie,
				tags,
				tagsObj,
				all_movies_average,
				search_vector
			) => {
				let movieVector = math.matrix(
					math.zeros([1, tags.length]),
					"sparse"
				);
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
				let { score, maxIndex } = cosine_similarity(
					search_vector,
					movieVector
				);
				// recommendedMovies.push({
				// 	_id: movie._id,
				// 	score: score,
				// 	maxTag: tags[maxIndex]
				// });
				await Movie.updateOne(
					{ _id: movie._id, "score._id": username },
					{ "score.$.score": score, "score.$.maxTag": tags[maxIndex] }
				);
			};
			let promises = [];
			let maxAsync = 100;

			for (let i = 0; i < movies.length; i++) {
				const movie = movies[i];
				// let avg_tags_idf;
				// try {
				// 	avg_tags_idf = math.mean(
				// 		movie.tags
				// 			.map((tag) => {
				// 				const index = tagsObj.get(tag._id);
				// 				if (index !== undefined) {
				// 					return tag.idf;
				// 				}
				// 			})
				// 			.filter((tag) => tag !== undefined)
				// 	);
				// } catch (err) {
				// 	avg_tags_idf = 0;
				// }
				promises.push(
					calc_tfidf(
						movie,
						tags,
						tagsObj,
						all_movies_average,
						search_vector
					)
				);
				if (promises.length === maxAsync) {
					await Promise.all(promises);
					console.log(`${i}/${movies.length}`);
					promises = [];
				}
			}
			await Promise.all(promises);
			// await User.updateOne(
			// 	{ _id: username },
			// 	{ $set: { recommended: recommendedMovies } }
			// );
			// await Movie.aggregate([
			// 	{
			// 		$match: {
			// 			$expr: {
			// 				$and: [
			// 					{
			// 						$in: [username, "$score._id"]
			// 					}
			// 				]
			// 			}
			// 		}
			// 	},
			// 	{
			// 		$addFields: {
			// 			score: {
			// 				$filter: {
			// 					input: "$score",
			// 					as: "el",
			// 					cond: {
			// 						$eq: ["$$el._id", username]
			// 					}
			// 				}
			// 			}
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
			// 		$lookup: {
			// 			from: "users",
			// 			let: {
			// 				movie_id: "$_id",
			// 				user_id: "$score._id"
			// 			},
			// 			pipeline: [
			// 				{
			// 					$match: {
			// 						$expr: {
			// 							$eq: ["$$user_id", "$_id"]
			// 						}
			// 					}
			// 				},
			// 				{
			// 					$unwind: {
			// 						path: "$recommended"
			// 					}
			// 				},
			// 				{
			// 					$match: {
			// 						$expr: {
			// 							$eq: ["$$movie_id", "$recommended._id"]
			// 						}
			// 					}
			// 				},
			// 				{
			// 					$project: {
			// 						"recommended.score": 1
			// 					}
			// 				},
			// 				{
			// 					$set: {
			// 						score: "$recommended.score"
			// 					}
			// 				},
			// 				{
			// 					$unset: ["recommended"]
			// 				}
			// 			],
			// 			as: "score.score"
			// 		}
			// 	},
			// 	{
			// 		$set: {
			// 			"score.score": {
			// 				$arrayElemAt: ["$score.score", 0]
			// 			}
			// 		}
			// 	},
			// 	{
			// 		$set: {
			// 			"score.score": "$score.score.score"
			// 		}
			// 	}
			// ]);
			// recommendedMovies = recommendedMovies.sort(
			// 	(a, b) => b.score - a.score
			// );
			res.redirect(`/user/${username}`);
			// movieVector = movieVector.toArray();
		}
	}
);
router.post(
	"/update_user",
	[
		body("username", "Please enter your letterboxd username.")
			.trim()
			.isLength({ min: 1 })
			.escape(),

		body(
			"accuracy",
			"Please select how accurate you want your recommendations to be."
		).isIn(["high", "med", "low"])
	],
	async (req, res) => {
		// Is user
	}
);
module.exports = router;
