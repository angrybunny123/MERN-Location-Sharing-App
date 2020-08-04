const fs = require("fs"); //filesystem, allows us to interact with files
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser"); //parse the body of incoming requests
const mongoose = require("mongoose");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
// this router can be used as a middleware!

const app = express();

//parsing any incoming request body, and extract any JSON data,
//and then calls the 'next' function.
app.use(bodyParser.json());

//serving images statically!
app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  //to bypass CORS error, because frontend runs on port 3000
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});
app.use("/api/places", placesRoutes); // => /api/places/...
app.use("/api/users", usersRoutes);

//this middleware is only reached if we have some request which didn't get a response before,
//(because if we do send a response, we dont call NEXT, we just send a response!)
//which can only be a request that we don't want to handle.
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error; //or call next, which will reach the default error handler!
});

//when 4 parameters, express takes this as an error handling
//middleware function. This function will only be executed on requests
//that have an error attached to it.
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    //check if response has been sent, lecture 91
    return next(error);
  }
  //500 means something went wrong on the server
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error has occured!" });
});

// app.use("/api/users", usersRoutes); // => /api/users/...

//on this app object, can register MIDDLEWARE!
//Either generic middleware which triggers for all (use),
//or middleware for specific HTTP methods, for get post patch etc.
//and need to specify a filter path.

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bg2wp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
//1) establish connection to database
//2) start backend server.
//If 1) fails, throw an error.
