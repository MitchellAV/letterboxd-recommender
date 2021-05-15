const express = require("express");
const router = express.Router();

const { query, param, validationResult } = require("express-validator");

const { scrapeThumbnails } = require("../util/recommendation_engine.js");
const { get_recommendations_by_movie_id } = require("../util/api-functions");
const paramValidation = [
	param("id").toInt().isInt().notEmpty(),
	query("filter").trim().isString().toLowerCase().escape().default(""),
	query("min_vote_count")
		.customSanitizer((value, { req, location, path }) => {
			return req[location][path] ? value : 1000;
		})
		.toInt()
		.isInt({ min: 1 }),
	query("min_vote_average")
		.customSanitizer((value, { req, location, path }) => {
			return req[location][path] ? value : 7;
		})
		.toFloat()
		.isFloat({ min: 0.5 }),
	query("min_runtime")
		.customSanitizer((value, { req, location, path }) => {
			return req[location][path] ? value : 40;
		})
		.toInt()
		.isInt({ min: 1 }),
	query("page")
		.customSanitizer((value, { req, location, path }) => {
			return req[location][path] ? value : 1;
		})
		.toInt()
		.isInt({ min: 1 }),
	query("num_per_page")
		.customSanitizer((value, { req, location, path }) => {
			return req[location][path] ? value : 30;
		})
		.toInt()
		.isIn([30, 60, 90, 120]),
	query("sort_type")
		.trim()
		.isString()
		.toLowerCase()
		.escape()
		.isIn([
			"recommended",
			"runtime",
			"movie_rating",
			"user_rating",
			"votes",
			"release_date"
		])
		.optional(),
	query("order")
		.customSanitizer((value, { req, location, path }) => {
			return req[location][path] ? value : -1;
		})
		.toInt()
		.isIn([-1, 1])
];

router.get("/:id", paramValidation, async (req, res, next) => {
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

		let recommendations = await get_recommendations_by_movie_id(
			id,
			filterParams
		);

		await scrapeThumbnails(recommendations);

		res.status(200).json({
			movies: recommendations,
			page: filterParams.page,
			numPages: 100
		});
	}
});
module.exports = router;
