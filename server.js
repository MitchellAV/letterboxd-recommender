const express = require("express");
const app = express();
const path = require("path");
var cors = require("cors");

app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Body Parser Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// set the view engine to ejs
app.set("view engine", "ejs");

app.use("/", require("./routes/recommender"));

app.listen(3000, console.log("Server started on "));
