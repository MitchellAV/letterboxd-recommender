const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const { update_all_tags } = require("./mongodb_rec");

mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	})
	.then(async (result) => {
		console.log("Sucessfully Connected to MongoDB Atlas Database");
		// await update_all_tags();
	})
	.catch((err) => console.error(err));
