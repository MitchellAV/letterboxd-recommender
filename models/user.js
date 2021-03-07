const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new Schema({
	_id: { type: Number },
	rating: { type: Number, min: 1, max: 10 }
});
const watchListSchema = new Schema({
	_id: { type: Number }
});
const followingSchema = new Schema({
	_id: { type: String }
});

const userSchema = new Schema(
	{
		_id: { type: String, required: true },
		movies: [movieSchema],
		watchList: [watchListSchema],
		following: [followingSchema]
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
