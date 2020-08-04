const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place"); //this is a constructor Place model
const User = require("../models/user");
const mongooseUniqueValidator = require("mongoose-unique-validator");
//idk why but this Place object has a lot of nice static methods

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }
  if (!place) {
    //404 is a standard status for: we didnt find anything!
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    //triggers the error handling middleware!
    return next(error);
  }
  //lecture 125
  //place is a 'Mongoose' object. We use toObject because it is easier to work
  //with Javasrcipt objects(?)
  //Now, it has an _id attribute, but we want an id attribute, cleaner.
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  //the default mongoose find() method returns all places.
  //Can find by specific properties by inserting javascript object.
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    //a standard status for: we didnt find anything!

    return next(
      new HttpError("Could not find places for the provided user id.", 404)
    ); //forwards the error to the next middleware in line
    //remember to RETURN so that the code below doesn't run.
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

//expect post request to have data in the body! Because it is a post request.
//Use Body Parser for this purpose!
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  //it will look into this req object and see if there are any validation errors
  //which were detected based on your setup in routes!

  //when working with async code, throw will not work.
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  //what we expect as data is up to us!
  //This is a short cut for doing smth like const title = req.body.title
  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  //make sure the properties in thie createdPlace has the same properties
  //as that of the Schema, if not an error will be thrown!
  const createdPlace = new Place({
    title: title,
    description: description,
    address: address,
    location: coordinates,
    image: req.file.path,
    creator: creator,
  });
  //.save() is a mongoose method to store a new document in your collection!
  //it will also create a unique ID. It returns a promise.

  let user;
  try {
    //we must check if the userID exists before we create the place!
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    //to stop code execution.
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id", 404);
    return next(error);
  }

  //transaction and sessions... ??? 135
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess }); //part of our current session
    //push is a special Mongoose method, adds the mongoDB objectID to the user places!
    user.places.push(createdPlace);
    await user.save({ session: sess }); //part of our current session
    await sess.commitTransaction();
    //over here, then they are saved into database. If got errors, no changes will be made.
  } catch (err) {
    const error = new HttpError(
      "Creating place failed, please try again.",
      500
    );
    //to stop code execution.
    return next(error);
  }
  //send back a response, 201 is a standard status code to send back
  //if something was successfully created on the server.
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  //it will look into this req object and see if there are any validation errors
  //which were detected based on your setup in routes!

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
    //returns the mongoose object with a lot of static methods available!
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }
  //note, place.creator is a mongoose object! Need to toString it.
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place.",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) }); //not 201 because we didnt create anything new!
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    //need to delete in the USERS collection also.
    //Can be done using the populate method, refer to a documnet stored in another collection and work with data.
    //In other words, populate gives the creator property ACCESS to the full user object linked to that place.
    //To do so, we need a relation between the 2 documents, and this was already established in the schema files.
    place = await Place.findById(placeId).populate("creator");
    //returns the mongoose object with a lot of static methods available!
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this id.", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place.", 401);
    return next(error);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place); //removes the place from the user!
    await place.creator.save({ session: sess });
    /***** */
    //We can use place.creator.places.pull place.creator.save like that because, thanks to populate, creator gives the full user object linked to that place.
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place.",
      500
    );
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};

//another form of node export syntax! All exports will be bundled as a single object.
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
