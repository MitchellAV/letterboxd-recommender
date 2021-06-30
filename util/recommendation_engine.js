"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeThumbnails = void 0;
var axios_1 = __importDefault(require("axios"));
var fs_1 = __importDefault(require("fs"));
var download_image = function (url, image_path) {
    return axios_1.default({
        url: url,
        responseType: "stream"
    }).then(function (response) {
        return new Promise(function (resolve, reject) {
            response.data
                .pipe(fs_1.default.createWriteStream(image_path))
                .on("finish", function () { return resolve(true); })
                .on("error", function (e) { return reject(e); });
        });
    });
};
var scrapeThumbnails = function (database) {
    var database_length = database.length;
    for (var i = 0; i < database_length; i++) {
        var movie = database[i];
        var _id = movie._id, thumbnail_url = movie.thumbnail_url;
        var path = "./public/thumbnails/" + _id + "-thumb.jpg";
        try {
            if (!fs_1.default.existsSync(path)) {
                try {
                    download_image(thumbnail_url, path);
                    console.log("Downloaded: " + (i + 1) + "/" + database_length);
                }
                catch (err) {
                    console.error(err);
                }
            }
        }
        catch (err) {
            console.error(err);
        }
    }
};
exports.scrapeThumbnails = scrapeThumbnails;
