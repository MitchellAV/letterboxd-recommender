import cheerio, { Cheerio, CheerioAPI, Element } from "cheerio";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());

import { Browser } from "puppeteer";
import {
  addLetterboxdIdToMovie,
  add_movie_to_database,
  findIdByLetterboxdId,
} from "./db_functions";

const browser_settings = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};
interface LetterboxdMovie {
  tmdb_id: number;
  letterboxd_id: number;
  rating: number | null;
}

const get_film_id = async (
  browser: Browser,
  letterboxd_url: string,
  letterboxd_id: number
): Promise<number> => {
  try {
    const moviePage = await browser.newPage();
    const movieUrl = `https://letterboxd.com${letterboxd_url}`;

    await moviePage.goto(movieUrl, {
      waitUntil: "load",
      timeout: 15 * 1000,
    });

    const movieContent = await moviePage.content();

    const $ = cheerio.load(movieContent);

    let film_id = $("body").attr("data-tmdb-id");
    if (film_id) {
      try {
        const tmdb_id = parseInt(film_id);
        try {
          await add_movie_to_database(tmdb_id);
          await addLetterboxdIdToMovie(tmdb_id, letterboxd_id);
        } catch (error) {}
        await moviePage.close();
        return tmdb_id;
      } catch (err) {
        console.log("movie does not exist in database");
        console.error(err);
        await moviePage.close();
        throw err;
      }
    } else {
      await moviePage.close();
      throw console.log("tmdb id does not exist");
    }
  } catch (error) {
    throw error;
  }
};

const get_movie_info = async (browser: Browser, $: CheerioAPI, el: Element) => {
  try {
    let tmdb_movie_id: number | null = null;
    let rating: number | null = null;
    let letterboxd_id = $(el).find("div").attr("data-film-id");
    if (letterboxd_id) {
      try {
        tmdb_movie_id = await findIdByLetterboxdId(parseInt(letterboxd_id));
        // await add_movie_to_database(tmdb_movie_id);
      } catch (error) {
        console.log(letterboxd_id + " does not exist in database");
      }
    }

    const letterboxd_url = $(el).find("div").attr("data-film-link");

    let film_rating_el = $(el).find("span.rating");

    if (film_rating_el.length !== 0) {
      const film_rating_class = $(film_rating_el).attr("class");
      if (film_rating_class) {
        let film_rating_string = film_rating_class.split(" ").pop();
        if (film_rating_string) {
          let film_rating = film_rating_string.split("-").pop();
          if (film_rating) {
            rating = parseInt(film_rating);
          }
        }
      }
    }

    if (!tmdb_movie_id && letterboxd_url && letterboxd_id) {
      try {
        const tmdb_id = await get_film_id(
          browser,
          letterboxd_url,
          parseInt(letterboxd_id)
        );
        if (tmdb_id && letterboxd_id) {
          const movie: LetterboxdMovie = {
            tmdb_id,
            letterboxd_id: parseInt(letterboxd_id),
            rating,
          };
          return movie;
        } else {
          throw console.log("properties do not exist");
        }
      } catch (err) {
        console.log(err);
        throw err;
      }
    } else {
      if (tmdb_movie_id) {
        const tmdb_id = tmdb_movie_id;
        if (tmdb_id && letterboxd_id) {
          const movie: LetterboxdMovie = {
            tmdb_id,
            letterboxd_id: parseInt(letterboxd_id),
            rating,
          };
          return movie;
        } else {
          throw console.log("properties do not exist");
        }
      } else {
        throw console.log("tmdb does not exist");
      }
    }
  } catch (error) {
    throw error;
  }
};

const get_movies_from_page = async (
  children: Cheerio<Element>,
  browser: Browser,
  $: CheerioAPI
) => {
  let promises: Promise<LetterboxdMovie>[] = [];
  let maxAsync = 6;
  let movies: LetterboxdMovie[] = [];
  for (let i = 0; i < children.length; i++) {
    const el = children[i];

    promises.push(get_movie_info(browser, $, el));
    if (promises.length === maxAsync || i == children.length - 1) {
      let movies_from_page = await Promise.allSettled(promises);
      movies_from_page.forEach((movie) => {
        if (movie.status == "fulfilled") {
          movies.push(movie.value);
        } else {
          console.log("unable to add movie to list");
        }
      });
      promises = [];
    }
    // try {
    //   const movie_info = await get_movie_info(browser, $, el);
    //   movies.push(movie_info);
    // } catch (error) {
    //   console.log("unable to add movie to list");
    // }
  }
  //   if (promises.length !== 0) {
  //     let movies_from_page = await Promise.all(promises);
  //     movies = movies.concat(movies_from_page);
  //   }
  return movies;
};

export const getLetterboxdUserMovies = async (username: string) => {
  try {
    let output: { rating: number | null; tmdb_id: number }[] = [];
    let pageNum = 1;
    let finished = false;
    let promises: Promise<LetterboxdMovie[]>[] = [];
    let maxAsync = 5;
    let maxPages = 1;
    const browser = await puppeteer.launch(browser_settings);
    const page = await browser.newPage();

    do {
      try {
        if (pageNum <= maxPages) {
          const url = `https://letterboxd.com/${username}/films/page/${pageNum}`;

          await page.goto(url, {
            waitUntil: "load",
            timeout: 30 * 1000,
          });

          const content = await page.content();

          const $ = cheerio.load(content);
          if (pageNum === 1) {
            maxPages = parseInt($(".paginate-pages>ul>li:last-child>a").text());
          }
          const children = $("ul.poster-list").children();
          //   promises.push(get_movies_from_page(children, browser, $));
          const list_of_movies_from_page = await get_movies_from_page(
            children,
            browser,
            $
          );
          list_of_movies_from_page.forEach((movie) => {
            const { rating, tmdb_id } = movie;
            output.push({ rating, tmdb_id });
          });
        } else {
          console.log("No more movies left.");
          finished = true;
          // await page.close();
        }
        // if (promises.length === maxAsync) {
        //   let movies_from_pages = await Promise.allSettled(promises);
        //   promises = [];
        //   output = output.concat(
        //     movies_from_pages.reduce((acc, val) => acc.concat(val), [])
        //   );
        // }
        pageNum++;
      } catch (error) {
        console.log(error);
      }
    } while (!finished);

    //   if (promises.length !== 0) {
    //     let movies_from_pages = await Promise.all(promises);
    //     promises = [];
    //     output = output.concat(
    //       movies_from_pages.reduce((acc, val) => acc.concat(val), [])
    //     );
    //   }
    await browser.close();
    console.log("Finished getting movies from user.");
    return output;
  } catch (error) {
    throw error;
  }
};

export const isRealLetterboxdUser = async (username: string) => {
  try {
    let userFound = false;

    const browser = await puppeteer.launch(browser_settings);
    const page = await browser.newPage();

    const url = `https://letterboxd.com/${username}/films/`;

    await page.goto(url, { waitUntil: "load" });

    const content = await page.content();

    const $ = cheerio.load(content);

    const exists = $(".poster-list").length;
    if (exists !== 0) userFound = true;

    await browser.close();
    return userFound;
  } catch (error) {
    throw error;
  }
};
