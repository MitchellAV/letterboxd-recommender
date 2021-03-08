const express = require("express");
const router = express.Router();
const math = require("mathjs");
const Movie = require("../models/movie");

const {
	scrapeThumbnails,
	cosine_similarity
} = require("../recommendation_engine.js");

const default_min_vote_count = 100;
const default_min_vote_average = 6;
const default_min_runtime = 40;
const default_num_per_page = 25;
const default_sort_type = "score.score";
const default_order = -1;

router.get("/:id", async (req, res) => {
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
	let min_vote_count =
		parseInt(req.query.min_vote_count) || default_min_vote_count;
	let min_vote_average =
		parseFloat(req.query.min_vote_average) || default_min_vote_average;
	let min_runtime = parseInt(req.query.min_runtime) || default_min_runtime;
	let page = parseInt(req.query.page) || 0;
	let num_per_page = parseInt(req.query.num_per_page) || default_num_per_page;
	let sort_type = req.query.sort_type || default_sort_type;
	let order = parseInt(req.query.order) || default_order;

	const movie = await Movie.findById(id).lean();
	const movies = req.app.get("MOVIES");

	let tags = movie.tags;

	// tags = tags.filter((tag) => !tagBlacklist.includes(tag._id));
	// tags = tags.map((tag) => tag._id);

	let tagsObj = new Map();
	tags.forEach((tag, i) => {
		tagsObj.set(tag, i);
	});

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
	// let avg_tags_idf = math.mean(
	// 	movie.tags
	// 		.map((tag) => {
	// 			const index = tagsObj.get(tag._id);
	// 			if (index !== undefined) {
	// 				return tag.idf;
	// 			}
	// 		})
	// 		.filter((tag) => tag !== undefined)
	// );
	movie.tags.forEach((tag) => {
		const index = tagsObj.get(tag._id);
		if (index !== undefined) {
			// avg_user_movie_rating
			// let tfidf = tag.idf;

			search_vector.set([0, index], 1);
		}
	});

	let recommendations = [];
	for (let i = 0; i < movies.length; i++) {
		const movie = movies[i];

		let movieVector = math.matrix(math.zeros([1, tags.length]), "sparse");
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
		movie.tags.forEach((tag) => {
			const index = tagsObj.get(tag);
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
	let url =
		req.url.indexOf("?") !== -1
			? req.url.slice(0, req.url.indexOf("?"))
			: req.url;
	res.render("pages/movie", {
		data: recommendations,
		search: filter,
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

	// movieVector = movieVector.toArray();
});
module.exports = router;
