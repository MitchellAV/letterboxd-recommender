const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const usersSchema = new Schema({
	_id: { type: String, unique: true },
	idf: { type: Number, default: 0, min: 0 }
});

const tagSchema = new Schema(
	{
		_id: String,
		count: { type: Number, min: 2 },
		idf: { type: Number, default: 0 },
		users: [usersSchema]
	},
	{ timestamps: true }
);

const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
