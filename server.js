const express = require("express");
const path = require("path");
var cors = require("cors");
const mongoose = require("mongoose");
const Movie = require("./models/movie");

const { get_database } = require("./recommendation_engine.js");
const {
	cleanDatabase,
	cleanDatabaseKeywords,
	cleanDatabaseCredits
} = require("./filter");
const app = express();
mongoose
	.connect("mongodb://localhost:27017/movies-db", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	})
	.then(async (result) => {
		console.log("Sucessfully connected to database movies-db");
		app.listen(3000, console.log("Server started on localhost:3000"));

		let filtered_database = [
			...get_database(0, Infinity, "./json/database/")
		];
		// let filtered_database = await Movie.find({});
		let filtered_database_keywords = [
			...get_database(0, Infinity, "./json/keywords/")
		];
		let filtered_database_credits = [
			...get_database(0, Infinity, "./json/credits/")
		];
		filtered_database = cleanDatabase(filtered_database);
		filtered_database_keywords = cleanDatabaseKeywords(
			filtered_database_keywords
		);
		filtered_database_credits = cleanDatabaseCredits(
			filtered_database_credits
		);
		// console.log("created filtered database");
		// await Movie.deleteMany({ keywords: { $size: 0 } });
		// console.log("Deleted movies");
		// filtered_database = await Movie.find();
		// let merged_keywords = merge_movies_keywords(
		// 	filtered_database_keywords,
		// 	filtered_database
		// );

		// try {
		// 	await Movie.deleteMany({ keywords: { $size: 0 } });
		// 	console.log(`${movie.id} deleted from Database`);
		// } catch (err) {
		// 	console.log(err);
		// }
		for (let i = 0; i < filtered_database.length; i++) {
			const movie = filtered_database[i];
			// {
			// 	tags: {'$setUnion':['$keywords','$genres'] }
			//   }
			const data = await Movie.findById(movie._id);
			if (!data) {
				try {
					const movieBSON = new Movie(movie);
					await movieBSON.save();
					console.log(`${movie._id} added to Database`);
				} catch (err) {
					console.log(err);
				}
			}
		}
		for (let i = 0; i < filtered_database_keywords.length; i++) {
			const movie = filtered_database_keywords[i];
			// {
			// 	tags: {'$setUnion':['$keywords','$genres'] }
			//   }
			const { id, ...rest } = movie;
			const data = await Movie.findById(movie._id);

			if (data) {
				try {
					await Movie.findByIdAndUpdate(movie._id, rest);
					console.log(`${movie._id} updated movie keyword`);
				} catch (err) {
					console.log(err);
				}
			}
		}
		for (let i = 0; i < filtered_database_credits.length; i++) {
			const movie = filtered_database_credits[i];
			// {
			// 	tags: {'$setUnion':['$keywords','$genres'] }
			//   }

			const { id, ...rest } = movie;
			const data = await Movie.findById(movie._id);
			if (data) {
				try {
					await Movie.findByIdAndUpdate(movie._id, rest);
					console.log(`${movie._id} updated movie keyword`);
				} catch (err) {
					console.log(err);
				}
			}
		}
	})
	.catch((err) => console.error(err));

app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Body Parser Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// set the view engine to ejs
app.set("view engine", "ejs");

app.use("/", require("./routes/recommender"));
