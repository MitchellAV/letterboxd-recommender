const Movie = require("./models/movie");
const Tag = require("./models/tag");
const User = require("./models/user");

const update_all_tags = async () => {
	const num_movies = await Movie.countDocuments({});
	await Movie.aggregate([
		{
			$set: {
				tags: {
					$setUnion: [
						"$keywords",
						"$genres",
						"$cast",
						"$crew",
						"$spoken_languages",
						"$overview_words"
					]
				}
			}
		},
		{
			$unwind: {
				path: "$tags"
			}
		},
		{
			$group: {
				_id: "$tags",
				count: {
					$sum: 1
				}
			}
		},
		{
			$match: {
				count: {
					$gt: 1
				}
			}
		},
		{
			$set: {
				idf: {
					$log10: {
						$divide: [num_movies, "$count"]
					}
				},
				users: []
			}
		},
		{
			$out: "tags"
		}
	]);
};

const update_user_tags = async (username) => {
	const user = await User.findById(username);
	const num_user_movies = user.movies.length;
	const user_tags = await Movie.aggregate([
		{
			$match: {
				_id: "mitchellv"
			}
		},
		{
			$project: {
				"movies._id": 1
			}
		},
		{
			$lookup: {
				from: "movies",
				localField: "movies._id",
				foreignField: "_id",
				as: "movies"
			}
		},
		{
			$project: {
				"movies.tags": 1
			}
		},
		{
			$unwind: {
				path: "$movies"
			}
		},
		{
			$unwind: {
				path: "$movies.tags"
			}
		},
		{
			$group: {
				_id: "$movies.tags",
				count: {
					$sum: 1
				}
			}
		},
		{
			$set: {
				idf: {
					$log10: {
						$divide: [num_user_movies, "$count"]
					}
				}
			}
		}
	]);
	const promises = [];
	for (const tag of user_tags) {
		promises.push(
			Tag.updateOne(
				{ _id: tag._id },
				{
					$cond:{
						if:{
							
						},

					}
					$addToSet: {
						users: { _id: username, count: tag.count, idf: tag.idf }
					}
				}
			)
		);
	}
};

module.exports = { update_all_tags };
