const express = require("express");
const router = express.Router();
const { getLetterboxdUserMovies } = require("../getletterboxd");

router.get("/:username/update", async (req, res) => {
	const username = req.params.username;
	await getLetterboxdUserMovies(username);
	res.redirect(`/${username}`);
});
