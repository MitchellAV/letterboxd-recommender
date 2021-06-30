import { NextFunction, Request, Response } from "express";

import express from "express";
const router = express.Router();
import Movie from "../models/movie";
import { validationResult } from "express-validator";

import { validationParams } from "../util/route-functions";
import { get_recommendations_by_movie_id } from "../util/api-functions";
import { scrapeThumbnails } from "../util/recommendation_engine";

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
	async (req: Request, res: Response, next: NextFunction) => {
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
			try {
				const target_movie: any = await Movie.findById(id).lean();
				const movie_title: string = target_movie.title;

				const { recommendations, total, total_pages } =
					await get_recommendations_by_movie_id(id, filterParams);

				scrapeThumbnails(recommendations);

				return res.status(200).json({
					target_movie: movie_title,
					movies: recommendations,

					page: filterParams.page,
					total: total,
					numPages: total_pages
				});
			} catch (err) {
				return next({
					message: "Unable to retrieve data from database",
					status: 404,
					errors: []
				});
			}
		}
	}
);
module.exports = router;
