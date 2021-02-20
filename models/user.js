const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const movieSchema = new Schema({
	_id: { type: Number },
	rating: { type: Number, default: 1, min: 1 }
});

const recSchema = new Schema({
	_id: { type: Number },
	score: { type: Number, default: 0, min: -1, max: 1 }
});

const userSchema = new Schema(
	{
		_id: { type: String, required: true },
		movies: [movieSchema],
		recommended: [recSchema]
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
