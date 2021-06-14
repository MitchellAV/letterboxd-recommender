const express = require("express");
const router = express.Router();
const Movie = require("../models/movie");
const { validationResult } = require("express-validator");

const { scrapeThumbnails } = require("../util/recommendation_engine.js");
const { get_recommendations_by_movie_id } = require("../util/api-functions");
const { validationParams } = require("../util/route-functions");

router.get(
	"/:id",
	validationParams(
		{
			min_vote_count: 1,
			min_vote_average: 0.5,
			min_runtime: 1
		},
		false
	),
	async (req, res, next) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			// There are errors. Render form again with sanitized values/errors messages.
			// Error messages can be returned in an array using `errors.array()`.

			return next({
				message: "Please fix the following fields:",
				status: 400,
				error: errors.array()
			});
		} else {
			// Initialize Constants
			const filterParams = req.query;
			const { id } = req.params;
			const target_movie = await Movie.findById(id).lean();
			const movie_title = target_movie.title;

			const { recommendations, total, total_pages } =
				await get_recommendations_by_movie_id(id, filterParams);

			await scrapeThumbnails(recommendations);

			res.status(200).json({
				target_movie: movie_title,
				movies: recommendations,

				page: filterParams.page,
				total: total,
				numPages: total_pages
			});
		}
	}
);
module.exports = router;
