const puppeteer = require("puppeteer-extra");
const cheerio = require("cheerio");
const fs = require("fs").promises;

const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const getMovies = async (user) => {
	try {
		const browser = await puppeteer.launch({
			headless: false
		});
		const page = await browser.newPage();
		const json = { movies: [] };
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
					const movie = { title: "", rating: null };

					const el = children[i];
					const film_name = $(el)
						.find("div")
						.attr("data-film-name")
						.toLowerCase();
					movie.title = film_name;

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

					json.movies.push(movie);
				}
				pagenum++;
			} else {
				console.log("No more movies left.");
				finished = true;
			}
		}
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
const main = async () => {
	await getMovies("ropeiscut");
};

main();
