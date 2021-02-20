const express = require("express");
const path = require("path");
var cors = require("cors");
const mongoose = require("mongoose");
const Movie = require("./models/movie");
const Tag = require("./models/tag");
const User = require("./models/user");

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
		// await Movie.updateMany({}, [
		// 	{
		// 		$set: {
		// 			score: [
		// 				{
		// 					_id: "ropeiscut",
		// 					score: 0
		// 				}
		// 			]
		// 		}
		// 	}
		// ]);
		// let usermovies = await User.findById("ropeiscut").lean();
		// usermovies = usermovies.recommended;
		// for (let i = 0; i < usermovies.length; i++) {
		// 	const movie = usermovies[i];
		// 	const { _id, score } = movie;
		// 	try {
		// 		let res = await Movie.updateOne(
		// 			{ _id: _id, "score._id": "ropeiscut" },
		// 			{ "score.$.score": score }
		// 		);
		// 		if (i % 1000 == 0) {
		// 			console.log(`${i}/${usermovies.length}`);
		// 		}
		// 	} catch (err) {
		// 		console.log(err);
		// 	}
		// }
		// const MOVIES = await Movie.aggregate([
		// 	{
		// 		$lookup: {
		// 			from: "tags",
		// 			localField: "tags.term",
		// 			foreignField: "_id",
		// 			as: "term"
		// 		}
		// 	},
		// 	{
		// 		$set: {
		// 			tags: {
		// 				$map: {
		// 					input: "$tags",
		// 					as: "el",
		// 					in: {
		// 						term: "$$el.term",
		// 						tf: "$$el.tf",
		// 						idf: {
		// 							$arrayElemAt: [
		// 								"$term.idf",
		// 								{
		// 									$indexOfArray: [
		// 										"$term._id",
		// 										"$$el.term"
		// 									]
		// 								}
		// 							]
		// 						}
		// 					}
		// 				}
		// 			}
		// 		}
		// 	},
		// 	{
		// 		$unset: [
		// 			"term",
		// 			"database_avg_rating",
		// 			"numTags",
		// 			"createdAt",
		// 			"updatedAt"
		// 		]
		// 	}
		// ]).allowDiskUse(true);
		console.log("Movies loaded");
		// app.set("MOVIES", MOVIES);
		app.listen(3000, console.log("Server started on localhost:3000"));

		// await Movie.updateMany({}, [
		// 	{
		// 		$set: {
		// 			tags: {
		// 				$map: {
		// 					input: "$tags",
		// 					as: "el",
		// 					in: {
		// 						term: "$$el.term",
		// 						tf: {
		// 							$divide: [1, "$numTags"]
		// 						}
		// 					}
		// 				}
		// 			}
		// 		}
		// 	}
		// ]);

		// const numDocs = await Movie.countDocuments({});
		// await Movie.updateMany({}, [
		// 	{
		// 		$set: {
		// 			numTags: {
		// 				$size: "$tags"
		// 			}
		// 		}
		// 	}
		// ]);
		// await Tag.deleteMany({ count: 1 });
		// await Tag.updateMany({}, [
		// 	{
		// 		$set: {
		// 			idf: {
		// 				$add: [
		// 					1,
		// 					{
		// 						$ln: {
		// 							$divide: [
		// 								{
		// 									$add: [1, "$numDocs"]
		// 								},
		// 								{
		// 									$add: [1, "$count"]
		// 								}
		// 							]
		// 						}
		// 					}
		// 				]
		// 			}
		// 		}
		// 	}
		// ]);
		// add tags to documents
		// await Movie.updateMany({}, [
		// 	{
		// 		$set: {
		// 			tags: {
		// 				$setUnion: [
		// 					"$keywords",
		// 					"$genres",
		// 					"$cast",
		// 					"$crew",
		// 					"$production_countries",
		// 					"$production_companies",
		// 					"$spoken_languages",
		// 					"$overview_words"
		// 				]
		// 			}
		// 		}
		// 	},
		// 	{
		// 		$set: {
		// tags: {
		// 	$map: {
		// 		input: "$tags",
		// 		as: "el",
		// 		in: {
		// 			term: "$$el",
		// 			tf: "0"
		// 		}
		// 	}
		// }
		// 		}
		// 	}
		// ]);

		// let filtered_database = [
		// 	...get_database(0, Infinity, "./json/database/")
		// ];
		// let filtered_database = await Movie.find({});
		// let filtered_database_keywords = [
		// 	...get_database(0, Infinity, "./json/keywords/")
		// ];
		// let filtered_database_credits = [
		// 	...get_database(0, Infinity, "./json/credits/")
		// ];
		// filtered_database = cleanDatabase(filtered_database);
		// filtered_database_keywords = cleanDatabaseKeywords(
		// 	filtered_database_keywords
		// );
		// filtered_database_credits = cleanDatabaseCredits(
		// 	filtered_database_credits
		// );
		// console.log("created filtered database");
		// await Movie.deleteMany({ keywords: { $size: 0 } });
		// console.log("Deleted movies");
		// filtered_database = await Movie.find();
		// let merged_keywords = merge_movies_keywords(
		// 	filtered_database_keywords,
		// 	filtered_database
		// );

		// try {
		// await Movie.deleteMany({ overview_words: { $size: 0 } });
		// try {
		// 	const result = await Movie.updateMany({}, [
		// 		{
		// 			$addFields: {
		// 				tags: {
		// 					$setUnion: [
		// 						"$keywords",
		// 						"$genres",
		// 						"$cast",
		// 						"$crew",
		// 						"$overview_words",
		// 						"$production_countries",
		// 						"$production_companies",
		// 						"$spoken_languages"
		// 					]
		// 				}
		// 			}
		// 		}
		// 	]);
		// 	console.log(result);
		// } catch (err) {
		// 	console.log(err);
		// }
		// try {
		// 	const result = await Movie.updateMany({}, [
		// 		{
		// 			$set: {
		// 				doc
		// 			}
		// 		}
		// 	]);
		// 	console.log(result);
		// } catch (err) {
		// 	console.log(err);
		// }

		// 	console.log(`${movie.id} deleted from Database`);
		// } catch (err) {
		// 	console.log(err);
		// }
		// for (let i = 0; i < filtered_database.length; i++) {
		// 	const movie = filtered_database[i];
		// 	// {
		// 	// 	tags: {'$setUnion':['$keywords','$genres'] }
		// 	//   }
		// 	const data = await Movie.findById(movie._id);
		// 	if (!data) {
		// 		try {
		// 			const movieBSON = new Movie(movie);
		// 			await movieBSON.save();
		// 			console.log(`${movie._id} added to Database`);
		// 		} catch (err) {
		// 			console.log(err);
		// 		}
		// 	}
		// }
		// for (let i = 0; i < filtered_database_keywords.length; i++) {
		// 	const movie = filtered_database_keywords[i];
		// 	// {
		// 	// 	tags: {'$setUnion':['$keywords','$genres'] }
		// 	//   }
		// 	const { id, ...rest } = movie;
		// 	const data = await Movie.findById(movie._id);

		// 	if (data) {
		// 		try {
		// 			await Movie.findByIdAndUpdate(movie._id, rest);
		// 			console.log(`${movie._id} updated movie keyword`);
		// 		} catch (err) {
		// 			console.log(err);
		// 		}
		// 	}
		// }
		// for (let i = 0; i < filtered_database_credits.length; i++) {
		// 	const movie = filtered_database_credits[i];
		// 	// {
		// 	// 	tags: {'$setUnion':['$keywords','$genres'] }
		// 	//   }

		// 	const { id, ...rest } = movie;
		// 	const data = await Movie.findById(movie._id);
		// 	if (data) {
		// 		try {
		// 			await Movie.findByIdAndUpdate(movie._id, rest);
		// 			console.log(`${movie._id} updated movie credits`);
		// 		} catch (err) {
		// 			console.log(err);
		// 		}
		// 	}
		// }
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
app.use("/", require("./routes/letterboxd"));
