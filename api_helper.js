const math = require("mathjs");

const update_user_movies = (movieArray, username) => {
	const newUser = {
		_id: username,
		movies: [],
		watchList: [],
		following: []
	};
	if (movieArray.length !== 0) {
		let ratings = movieArray.map((movie) => movie.rating);
		ratings = ratings.filter((rating) => rating !== null);
		let avg = math.mean(ratings) || 1;
		movieArray.forEach((movie) => {
			const movieObj = {
				_id: movie._id,
				rating: movie.rating || avg
			};
			if (!isNaN(movieObj._id)) {
				newUser.movies.push(movieObj);
			}
		});
	}
};

const get_user_tags = (user_movie_ids) => {
	return { user_tags, user_tag_map };
};

module.exports = { update_user_movies };
