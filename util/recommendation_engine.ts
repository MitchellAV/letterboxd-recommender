import axios from "axios";
import { log } from "console";
import fs from "fs";
import { MovieJSON } from "../types";

const download_image = async (url: string, image_path: string) =>
  axios({
    url,
    responseType: "stream",
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on("finish", () => resolve(true))
          .on("error", (e: any) => reject(e));
      })
  );

export const scrapeThumbnails = async (movies: MovieJSON[]) => {
  const movies_length = movies.length;
  for (let i = 0; i < movies_length; i++) {
    const movie = movies[i];
    const { movieId, poster_path } = movie;
    const path = "./public/thumbnails/" + movieId + "-thumb.jpg";
    try {
      if (!fs.existsSync(path)) {
        if (poster_path) {
          try {
            await download_image(poster_path, path);
            console.log(`Downloaded: ${i + 1}/${movies_length}`);
          } catch (err) {
            throw new Error("Unable to download movie poster");
          }
        }
      }
    } catch (err: any) {
      if (err.message) {
        console.log(err.message);
      }
    }
  }
};
