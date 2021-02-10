const assign_popularity = (num_favorites) => {
	let tag = "";
	if (num_favorites <= 2000) {
		tag = "popularity-0";
	} else if (num_favorites <= 5000) {
		tag = "popularity-1";
	} else if (num_favorites <= 10000) {
		tag = "popularity-2";
	} else if (num_favorites <= 25000) {
		tag = "popularity-3";
	} else if (num_favorites <= 50000) {
		tag = "popularity-4";
	} else {
		tag = "popularity-5";
	}
	return tag;
};
const assign_length = (num_pages) => {
	let tag = "";
	if (num_pages <= 15) {
		tag = "length-very-short";
	} else if (num_pages <= 35) {
		tag = "length-short";
	} else if (num_pages <= 100) {
		tag = "length-medium";
	} else {
		tag = "length-long";
	}
	return tag;
};

const get_img_type = (img_char) => {
	let tag = "";
	if (img_char == "j") {
		tag = ".jpg";
	} else if (img_char == "p") {
		tag = ".png";
	}
	return tag;
};

const filterDatabase = (input_array, searchlist) => {
	let output_array = [];
	input_array.forEach((movie, i) => {
		let skip = false;
		let newfilter = { ...searchlist };

		const { tags } = movie;

		if (!skip) {
			if (newfilter.tags.length !== 0) {
				for (let j = 0; j < tags.length; j++) {
					let tag = tags[j];
					if (!newfilter.tags.includes(tag)) {
						skip = true;
					} else {
						skip = false;
						break;
					}
				}
			}
		}

		if (!skip) {
			output_array.push(input_array[i]);
		}
	});

	return output_array;
};
let common_tags = [
	"a",
	"about",
	"above",
	"after",
	"again",
	"against",
	"all",
	"am",
	"an",
	"and",
	"any",
	"are",
	"aren't",
	"as",
	"at",
	"be",
	"because",
	"been",
	"before",
	"being",
	"below",
	"between",
	"both",
	"but",
	"by",
	"can't",
	"cannot",
	"could",
	"couldn't",
	"did",
	"didn't",
	"do",
	"does",
	"doesn't",
	"doing",
	"don't",
	"down",
	"during",
	"each",
	"few",
	"for",
	"from",
	"further",
	"had",
	"hadn't",
	"has",
	"hasn't",
	"have",
	"haven't",
	"having",
	"he",
	"he'd",
	"he'll",
	"he's",
	"her",
	"here",
	"here's",
	"hers",
	"herself",
	"him",
	"himself",
	"his",
	"how",
	"how's",
	"i",
	"i'd",
	"i'll",
	"i'm",
	"i've",
	"if",
	"in",
	"into",
	"is",
	"isn't",
	"it",
	"it's",
	"its",
	"itself",
	"let's",
	"me",
	"more",
	"most",
	"mustn't",
	"my",
	"myself",
	"no",
	"nor",
	"not",
	"of",
	"off",
	"on",
	"once",
	"only",
	"or",
	"other",
	"ought",
	"our",
	"ours	",
	"ourselves",
	"out",
	"over",
	"own",
	"same",
	"shan't",
	"she",
	"she'd",
	"she'll",
	"she's",
	"should",
	"shouldn't",
	"so",
	"some",
	"such",
	"than",
	"that",
	"that's",
	"the",
	"their",
	"theirs",
	"them",
	"themselves",
	"then",
	"there",
	"there's",
	"these",
	"they",
	"they'd",
	"they'll",
	"they're",
	"they've",
	"this",
	"those",
	"through",
	"to",
	"too",
	"under",
	"until",
	"up",
	"very",
	"was",
	"wasn't",
	"we",
	"we'd",
	"we'll",
	"we're",
	"we've",
	"were",
	"weren't",
	"what",
	"what's",
	"when",
	"when's",
	"where",
	"where's",
	"which",
	"while",
	"who",
	"who's",
	"whom",
	"why",
	"why's",
	"with",
	"won't",
	"would",
	"wouldn't",
	"you",
	"you'd",
	"you'll",
	"you're",
	"you've",
	"your",
	"yours",
	"yourself",
	"yourselves"
];

const cleanDatabase = (input_array) => {
	const output_array = [];
	input_array.forEach((movie) => {
		const {
			id,
			title,
			vote_count,
			vote_average,
			spoken_languages,
			release_date,
			production_countries,
			production_companies,
			poster_path,
			runtime,
			revenue,
			overview,
			original_title,
			original_language,
			imdb_id,
			genres,
			budget,
			backdrop_path
		} = movie;
		const filteredBook = {
			id,
			title,
			vote_count,
			vote_average,
			release_date,
			production_countries: [],
			production_companies: [],
			spoken_languages: [],
			runtime,
			revenue,
			overview,
			original_title,
			original_language,
			imdb_id,
			genres: [],
			budget,
			thumbnail_url: poster_path
				? `https://image.tmdb.org/t/p/original${poster_path}`
				: "",
			backdrop_url: backdrop_path
				? `https://image.tmdb.org/t/p/original${backdrop_path}`
				: "",
			tags: [],
			score: 0
		};
		let overview_words = overview
			.replace(/[.,\/#!$%\^&\*;:{}=\-\–\"_`~()]/g, "")
			.replace(/\s+/g, " ")
			.toLowerCase()
			.split(" ");
		overview_words = overview_words.filter(
			(tag) => !common_tags.includes(tag)
		);

		filteredBook.tags = [...overview_words];
		for (let i = 0; i < genres.length; i++) {
			const genre = genres[i].name.toLowerCase();
			filteredBook.genres.push(genre);
			filteredBook.tags.push(genre);
		}
		for (let i = 0; i < spoken_languages.length; i++) {
			const lang = spoken_languages[i].english_name.toLowerCase();

			filteredBook.spoken_languages.push(lang);
			filteredBook.tags.push(lang);
		}
		for (let i = 0; i < production_countries.length; i++) {
			const country = production_countries[i].name.toLowerCase();
			filteredBook.production_countries.push(country);
			filteredBook.tags.push(country);
		}
		for (let i = 0; i < production_companies.length; i++) {
			const company = production_companies[i].name.toLowerCase();
			filteredBook.production_companies.push(company);
			filteredBook.tags.push(company);
		}

		output_array.push(filteredBook);
	});

	return output_array;
};
module.exports = { filterDatabase, cleanDatabase };
