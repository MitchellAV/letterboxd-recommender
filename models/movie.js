const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new Schema(
	{
		_id: Number,
		title: { type: String, required: true },
		overview: { type: String },
		keywords: [String],
		tags: [String],
		thumbnail_url: String,
		score: Number,
		adult: Boolean,
		genres: [String],
		cast: [String],
		crew: [String],
		directors: [String],
		producers: [String],
		writers: [String],
		dp: [String],
		screenplay: [String],
		original_title: String,
		original_language: String,
		imdb_id: String,
		vote_count: Number,
		vote_average: Number,
		release_date: String,
		production_countries: [String],
		production_companies: [String],
		spoken_languages: [String],
		runtime: Number,
		revenue: Number,
		budget: Number
	},
	{ timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
