const express = require("express");
const router = express.Router();
const math = require("mathjs");

const { filter_params } = require("../util/route-functions");

const { scrapeThumbnails } = require("../recommendation_engine.js");
const { get_recommendations_by_movie_id } = require("../util/api-functions");

router.get("/:id", async (req, res) => {
	// Initialize Constants
	const id = req.params.id;
	const filterParams = filter_params(req);

	let recommendations = await get_recommendations_by_movie_id(
		id,
		filterParams
	);

	await scrapeThumbnails(recommendations);

	res.status(200).json({
		movies: recommendations,
		page: filterParams.page
	});
});
module.exports = router;
