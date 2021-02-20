const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const hasOverview = (str) => {
	return str !== "" && str.toLowerCase() !== "none available";
};

const scoreSchema = new Schema({
	_id: {
		type: String
	},
	score: {
		type: Number,
		required: true
	}
});

const movieSchema = new Schema(
	{
		_id: Number,
		title: { type: String, required: true },
		overview: {
			type: String,
			required: true,
			validate: {
				validator: hasOverview
			}
		},
		keywords: [String],
		tags: [String],
		thumbnail_url: { type: String, required: true },
		score: [scoreSchema],
		adult: { type: Boolean, required: true },
		genres: [{ type: String, required: true }],
		cast: [String],
		crew: [String],
		directors: [String],
		producers: [String],
		writers: [String],
		dp: [String],
		screenplay: [String],
		overview_words: [{ type: String, required: true }],
		original_title: { type: String, required: true },
		original_language: { type: String, required: true },
		imdb_id: { type: String, required: true },
		vote_count: { type: Number, required: true, min: 1 },
		vote_average: { type: Number, required: true, min: 0.5 },
		release_date: { type: String, required: true },
		production_countries: [String],
		production_companies: [String],
		spoken_languages: [String],
		runtime: { type: Number, required: true, min: 1 },
		revenue: Number,
		budget: Number
	},
	{ timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);
module.exports = Movie;
