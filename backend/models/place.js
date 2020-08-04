const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const placeSchema = new Schema({
  //can add more information if put as JS object! Check mongoose
  //docs for all the limitations u can place!
  title: { type: String, required: true },
  description: { type: String, required: true },
  //images are stored in database as URLs! If not, too slow!
  image: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  //saying that it will be a mongoDB object id!
  //'ref' allows you to establish connection with User schema.
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  //We are storing the actual mongoDB object, and hence mongoose static methods will work on it!
  //id will be created automatically by mongoDB
});

module.exports = mongoose.model("Place", placeSchema);
