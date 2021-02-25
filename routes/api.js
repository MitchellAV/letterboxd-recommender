const express = require("express");
const fs = require("fs");

const router = express.Router();
const math = require("mathjs");
const Movie = require("../models/movie");
const Tag = require("../models/tag");
const User = require("../models/user");

router.get("/:username/update", async (req, res) => {
	const username = req.params.username;
	let usermovies = await User.findById(username).lean();

	// try {
	// 	usermovies = require(`../json/users/${username}-movies.json`).movies;
	// } catch (err) {
	// 	console.log(err);
	// 	return res.redirect(`/${username}/letterboxd`);
	// }
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

	if (usermovies === null && username !== "") {
		const newUser = {
			_id: username,
			movies: [],
			recommended: []
		};
		const userToSave = new User(newUser);
		try {
			await userToSave.save();

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

	const movies = req.app.get("MOVIES");
	tags = tags.filter((tag) => (tag.count / movies.length) * 100 <= 3);
	// tags = tags.filter((tag) => tag.count >= 20);
	tags = tags.filter((tag) => !tagBlacklist.includes(tag._id));

	tags = tags.map((tag) => tag._id);

	let tagsObj = new Map();
	tags.forEach((tag, i) => {
		tagsObj.set(tag, i);
	});
	// tags = tags.map((tag, i) => {
	// 	return { ...tag, index: i };
	// });

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
		let movieVector = math.matrix(math.zeros([1, tags.length]), "sparse");
		movie.tags.forEach((tag) => {
			const index = tagsObj.get(tag._id);
			if (index !== undefined) {
				// avg_user_movie_rating
				let tfidf = tag.idf;
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
	let recommendedMovies = [];
	for (let i = 0; i < movies.length; i++) {
		const movie = movies[i];
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
					5
				);

				movieVector.set([0, index], tfidf * ratingWeight);
			}
		});
		let { score, maxIndex } = cosine_similarity(search_vector, movieVector);
		recommendedMovies.push({
			_id: movie._id,
			score: score,
			maxTag: tags[maxIndex]
		});
		await Movie.updateOne(
			{ _id: movie._id, "score._id": username },
			{ "score.$.score": score, "score.$.maxTag": tags[maxIndex] }
		);
		if (i % 1000 == 0) {
			console.log(`${i}/${movies.length}`);
		}
	}
	await User.updateOne(
		{ _id: username },
		{ $set: { recommended: recommendedMovies } }
	);
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
	recommendedMovies = recommendedMovies.sort((a, b) => b.score - a.score);
	res.redirect(`/${username}`);
	// movieVector = movieVector.toArray();
});
