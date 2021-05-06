const express = require("express");
const router = express.Router();
const math = require("mathjs");

const {
	format_query,
	filter_params,
	format_url
} = require("../util/route-functions");

const { scrapeThumbnails } = require("../recommendation_engine.js");
const { get_recommendations_by_movie_id } = require("../util/api-functions");

router.get("/:id", async (req, res) => {
	// Initialize Constants
	const id = req.params.id;
	const filterParams = filter_params(req);

	const queryString = format_query(req);

	let recommendations = await get_recommendations_by_movie_id(
		id,
		filterParams
	);
	if (recommendations.length === 0) {
		return res.render("pages/404");
	}

	await scrapeThumbnails(recommendations);
	const url = format_url(req);

	res.render("pages/movie", {
		data: recommendations,
		search: filterParams.filter,
		page: filterParams.page,
		queryString,
		url,
		filterParams
	});

	// movieVector = movieVector.toArray();
});
module.exports = router;
