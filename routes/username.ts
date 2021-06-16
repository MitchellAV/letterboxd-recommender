import { NextFunction, Request, Response } from "express";

import express from "express";
const router = express.Router();
import { validationResult } from "express-validator";

import { validationParams, sort_order } from "../util/route-functions";
import { scrapeThumbnails } from "../util/recommendation_engine";
import { QueryParams } from "../util/types";

const {
	get_user_movie_ids,
	get_recommendations,
	get_user_movies
} = require("../util/db-functions");

router.get(
	"/:username/personal",
	validationParams(
		{
			min_vote_count: 1,
			min_vote_average: 0.5,
			min_runtime: 1
		},
		true
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
			// Initialize constants
			const filterParams: QueryParams = req.query as any;
			const { username } = req.params;
			const sort_by = sort_order(
				filterParams.sort_type,
				filterParams.order
			);

			// Get user movies
			let user_movie_ids = await get_user_movie_ids(username);

			// Get recommendations from database
			let [user_movies, total, total_pages] = await get_user_movies(
				username,
				user_movie_ids,
				filterParams,
				sort_by
			);

			// Get thumbnails if not already saved
			scrapeThumbnails(user_movies);

			res.status(200).json({
				movies: user_movies,
				filterParams,
				page: filterParams.page,
				total: total,
				numPages: total_pages
			});
		}
	}
);

router.get(
	"/:username",
	validationParams(
		{
			min_vote_count: 300,
			min_vote_average: 6,
			min_runtime: 30
		},
		true
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
			const filterParams: QueryParams = req.query as any;
			const { username } = req.params;
			const sort_by = sort_order(
				filterParams.sort_type,
				filterParams.order
			);

			// Get user movie ids
			let user_movie_ids = await get_user_movie_ids(username);

			// Get recommendations from database
			let [recommendations, total, total_pages] =
				await get_recommendations(
					username,
					user_movie_ids,
					filterParams,
					sort_by
				);

			// Get thumbnails if not already saved
			scrapeThumbnails(recommendations);

			res.status(200).json({
				movies: recommendations,
				filterParams,
				page: filterParams.page,
				total: total,
				numPages: total_pages
			});
		}
	}
);

module.exports = router;
