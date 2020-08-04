const mongoose = require("mongoose");

const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  //unique makes querying faster (idk how). Creates an index for the email. Hashmap?
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String, required: true },
  //1 user can have many places. We will store the ids of the places allocated to each user.
  //saying that it will be a mongoDB object id!
  //'ref' allows you to establish connection with Place schema.

  //Note the array brackets, this is how we tell Mongoose that we have MULTIPLE places entries.
  //We are storing the actual mongoDB object, and hence mongoose static methods will work on it!
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});

//ensures that email is unique!
userSchema.plugin(uniqueValidator);

//the first argument will be singular form of our database name.
module.exports = mongoose.model("User", userSchema);
