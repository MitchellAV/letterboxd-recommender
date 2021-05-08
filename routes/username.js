const express = require("express");
const router = express.Router();

const { scrapeThumbnails } = require("../recommendation_engine.js");
const {
	format_query,
	sort_order,
	filter_params,
	format_url
} = require("../util/route-functions");
const {
	get_user_movie_ids,
	get_recommendations,
	get_user_movies
} = require("../util/db-functions");

router.get("/:username/personal", async (req, res) => {
	// Initialize constants
	const filterParams = filter_params(req);

	const username = req.params.username;
	const queryString = format_query(req);
	const sort_by = sort_order(filterParams.sort_type, filterParams.order);

	// Get user movies
	let user_movie_ids = await get_user_movie_ids(username);

	// Get recommendations from database
	let user_movies = await get_user_movies(
		username,
		user_movie_ids,
		filterParams,
		sort_by
	);

	// Get thumbnails if not already saved
	await scrapeThumbnails(user_movies);
	const url = format_url(req);

	res.status(200).json({
		movies: user_movies,

		page: filterParams.page
	});
});

router.get("/:username", async (req, res) => {
	// Initialize Constants
	const filterParams = filter_params(req);
	const username = req.params.username;
	const queryString = format_query(req);
	const sort_by = sort_order(filterParams.sort_type, filterParams.order);

	// Get user movie ids
	let user_movie_ids = await get_user_movie_ids(username);

	// Get recommendations from database
	let recommendations = await get_recommendations(
		username,
		user_movie_ids,
		filterParams,
		sort_by
	);

	// Get thumbnails if not already saved
	await scrapeThumbnails(recommendations);
	const url = format_url(req);

	res.status(200).json({
		movies: recommendations,
		page: filterParams.page
	});
});

module.exports = router;
