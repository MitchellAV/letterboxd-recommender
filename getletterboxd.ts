import cheerio, { Cheerio, CheerioAPI, Element } from "cheerio";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());

import { Browser, DirectNavigationOptions } from "puppeteer";
import {
  addLetterboxdIdToMovie,
  addMovieIgnoreId,
  addMovieLetterboxdIgnoreId,
  addMovieNotFoundId,
  add_movie_to_database,
  findIdByLetterboxdId,
  isIgnoreLetterboxdMovie,
  isIgnoreMovie,
  isMovieNotFoundById,
} from "./db_functions";

const browser_settings = {
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

const goto_params: DirectNavigationOptions = {
  waitUntil: "networkidle0",
  timeout: 30 * 1000,
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
  const moviePage = await browser.newPage();
  try {
    const movieUrl = `https://letterboxd.com${letterboxd_url}`;

    await moviePage.goto(movieUrl, goto_params);

    const movieContent = await moviePage.content();

    const $ = cheerio.load(movieContent);

    let film_id = $("body").attr("data-tmdb-id");
    if (film_id) {
      const isNotFound = await isMovieNotFoundById(parseInt(film_id));
      if (!isNotFound) {
        try {
          const tmdb_id = parseInt(film_id);
          await add_movie_to_database(tmdb_id);
          await addLetterboxdIdToMovie(tmdb_id, letterboxd_id);
          await moviePage.close();
          return tmdb_id;
        } catch (err) {
          await addMovieLetterboxdIgnoreId(letterboxd_id);
          await moviePage.close();
          throw new Error(`TMDb: ${film_id} - Film is not a movie on TMDb`);
        }
      } else {
        await addMovieLetterboxdIgnoreId(letterboxd_id);
        await moviePage.close();
        throw new Error(`TMDb: ${film_id} - Film is in not found list`);
      }
    } else {
      await addMovieLetterboxdIgnoreId(letterboxd_id);
      await moviePage.close();
      throw new Error(`Letterboxd: ${letterboxd_id} - Has no TMDb ID`);
    }
  } catch (error) {
    await moviePage.close();
    throw new Error(`Letterboxd: ${letterboxd_id} - Unable to get TMDb ID`);
  }
};

const get_movie_info = async (browser: Browser, $: CheerioAPI, el: Element) => {
  try {
    let tmdb_movie_id: number | null = null;
    let rating: number | null = null;
    let letterboxd_id = $(el).find("div").attr("data-film-id");
    if (letterboxd_id) {
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

      const isLetterboxdIgnore = await isIgnoreLetterboxdMovie(
        parseInt(letterboxd_id)
      );

      if (!isLetterboxdIgnore) {
        try {
          const tmdb_id = await findIdByLetterboxdId(parseInt(letterboxd_id));
          const movie: LetterboxdMovie = {
            tmdb_id,
            letterboxd_id: parseInt(letterboxd_id),
            rating,
          };
          return movie;
        } catch (error) {
          if (letterboxd_url) {
            try {
              const tmdb_id = await get_film_id(
                browser,
                letterboxd_url,
                parseInt(letterboxd_id)
              );
              const movie: LetterboxdMovie = {
                tmdb_id,
                letterboxd_id: parseInt(letterboxd_id),
                rating,
              };
              return movie;
            } catch (err) {
              throw err;
            }
          } else {
            throw new Error(
              `Letterboxd: ${letterboxd_id} - Letterboxd Url does not exist`
            );
          }
        }
      } else {
        throw new Error(`Letterboxd: ${letterboxd_id} - Movie Ignored`);
      }
    } else {
      throw new Error(`Does not have a Letterboxd ID`);
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
  let maxAsync = 12;
  let movies: LetterboxdMovie[] = [];
  for (let i = 0; i < children.length; i++) {
    const el = children[i];

    promises.push(get_movie_info(browser, $, el));
    if (promises.length === maxAsync || i == children.length - 1) {
      let movies_from_page = await Promise.allSettled(promises);
      movies_from_page.forEach((movie) => {
        if (movie.status == "fulfilled") {
          movies.push(movie.value);
        }
      });
      promises = [];
    }
  }

  return movies;
};

export const getLetterboxdUserMovies = async (
  username: string,
  movie_type: "films" | "watchlist" | "popular"
) => {
  const browser = await puppeteer.launch(browser_settings);
  const page = await browser.newPage();
  try {
    let output: { rating: number | null; tmdb_id: number }[] = [];
    let pageNum = 1;
    let finished = false;
    let promises: Promise<LetterboxdMovie[]>[] = [];
    let maxAsync = 5;
    let maxPages = movie_type == "popular" ? 10000 : 1;

    do {
      try {
        if (pageNum <= maxPages) {
          const url =
            movie_type == "popular"
              ? `https://letterboxd.com/films/popular/size/small/page/${pageNum}`
              : `https://letterboxd.com/${username}/${movie_type}/page/${pageNum}`;

          await page.goto(url, goto_params);

          const content = await page.content();

          const $ = cheerio.load(content);
          if (pageNum === 1) {
            maxPages = parseInt($(".paginate-pages>ul>li:last-child>a").text());
            if (isNaN(maxPages)) {
              maxPages = movie_type == "popular" ? 10000 : 1;
            }
          }
          const children = $("ul.poster-list").children();
          //   promises.push(get_movies_from_page(children, browser, $));
          const list_of_movies_from_page = await get_movies_from_page(
            children,
            browser,
            $
          );
          if (list_of_movies_from_page.length === 0) {
            finished = true;
          }
          list_of_movies_from_page.forEach((movie) => {
            const { rating, tmdb_id } = movie;
            output.push({ rating, tmdb_id });
          });
          pageNum++;
          console.log(
            `${username} - Finished ${movie_type} page: ${
              pageNum - 1
            }/${maxPages}`
          );
        } else {
          console.log("No more movies left.");
          finished = true;
        }
      } catch (error) {
        console.log(error);
      }
    } while (!finished);

    await page.close();
    await browser.close();
    console.log("Finished getting movies from user.");
    return output;
  } catch (error) {
    await page.close();
    await browser.close();
    throw error;
  }
};

export const isRealLetterboxdUser = async (username: string) => {
  const browser = await puppeteer.launch(browser_settings);
  const page = await browser.newPage();
  try {
    let userFound = false;

    const url = `https://letterboxd.com/${username}/films/`;

    await page.goto(url, goto_params);

    const content = await page.content();

    const $ = cheerio.load(content);

    const exists = $(".poster-list").length;
    if (exists !== 0) userFound = true;

    await page.close();
    await browser.close();
    return userFound;
  } catch (error) {
    await page.close();
    await browser.close();
    throw error;
  }
};
const getNetworkPage = async (
  pageNum: number,
  username: string,
  network_type: string,
  browser: Browser
) => {
  const page = await browser.newPage();
  try {
    let people: string[] = [];

    const url = `https://letterboxd.com/${username}/${network_type}/page/${pageNum}`;

    await page.goto(url, goto_params);

    const content = await page.content();

    const $ = cheerio.load(content);

    const children = $("tbody").children();
    for (const person of children) {
      const p = $(person).find(".avatar").attr("href");
      if (p) {
        people.push(p.replaceAll("/", ""));
      }
    }
    await page.close();
    return people;
  } catch (error) {
    await page.close();
    throw new Error("Unable to get network page");
  }
};

export const getLetterboxdUserNetwork = async (
  username: string,
  network_type: "followers" | "following"
) => {
  const browser = await puppeteer.launch(browser_settings);
  try {
    let all_people: string[] = [];
    let pageNum = 1;
    let finished = false;
    let maxAsync = 5;
    let promises: Promise<string[]>[] = [];
    while (!finished) {
      promises.push(getNetworkPage(pageNum, username, network_type, browser));
      if (promises.length === maxAsync) {
        let people_from_page = await Promise.allSettled(promises);
        people_from_page.forEach((people) => {
          if (people.status == "fulfilled") {
            let people_list = people.value;
            if (people_list.length !== 0) {
              all_people = all_people.concat(people_list);
            } else {
              finished = true;
            }
          } else {
            finished = true;
          }
        });
        promises = [];
      }

      pageNum++;
    }
    await browser.close();
    return all_people;
  } catch (error) {
    await browser.close();
    console.log(error);

    throw error;
  }
};
