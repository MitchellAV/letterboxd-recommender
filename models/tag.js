const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tagSchema = new Schema(
	{
		_id: String,
		count: { type: Number, min: 2 },
		idf: { type: Number, default: 0 }
	},
	{ timestamps: true }
);

const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
