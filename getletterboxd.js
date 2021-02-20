const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const getLetterboxdUserMovies = async (user) => {
	try {
		const browser = await puppeteer.launch({
			headless: false
		});
		const page = await browser.newPage();
		const json = { movies: [], avg_rating: null };
		let pagenum = 1;
		let finished = false;
		while (!finished) {
			const url = `https://letterboxd.com/${user}/films/page/${pagenum}`;

			await page.goto(url, { waitUntil: "domcontentloaded" });
			await page.waitForSelector("#content");

			const content = await page.content();

			const $ = cheerio.load(content);

			const children = $("ul.poster-list").children();
			if (children.length !== 0) {
				for (let i = 0; i < children.length; i++) {
					const movie = { id: null, title: null, rating: null };

					const el = children[i];

					const film_name = $(el).find("div").attr("data-film-name");

					movie.title = film_name.toLowerCase();

					let film_rating_class = $(el).find("span.rating");

					if (film_rating_class.length !== 0) {
						film_rating_class = $(film_rating_class)
							.attr("class")
							.split(" ")
							.pop();
						const film_rating = parseInt(
							film_rating_class.split("-").pop()
						);
						movie.rating = film_rating;
					}

					const film_link = $(el).find("div").attr("data-film-link");

					const moviePage = await browser.newPage();
					const movieUrl = `https://letterboxd.com/${film_link}`;

					await moviePage.goto(movieUrl, {
						waitUntil: "domcontentloaded"
					});

					const movieContent = await moviePage.content();

					const $m = cheerio.load(movieContent);

					const film_id = $m("body").attr("data-tmdb-id");
					movie.id = film_id;
					json.movies.push(movie);
					await moviePage.close();
				}
				pagenum++;
			} else {
				console.log("No more movies left.");
				finished = true;
			}
		}
		let num_of_movies = 0;
		let sum_rating = 0;
		json.movies.forEach((movie) => {
			if (movie.rating !== null) {
				num_of_movies++;
				sum_rating += movie.rating;
			}
		});
		let avg_rating = sum_rating / num_of_movies;
		json.avg_rating = avg_rating;
		await fs.writeFile(
			`./json/users/${user}-movies.json`,
			JSON.stringify(json)
		);
		await browser.close();
	} catch (err) {
		console.error(err);
	}
	console.log("Finished getting movies from user.");
};

module.exports = { getLetterboxdUserMovies };
