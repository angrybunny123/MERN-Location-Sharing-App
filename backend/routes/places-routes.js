//register the middleware responsible for handling routes related to places

const express = require("express");
const { check } = require("express-validator");
//check takes the name of the field in your request body which you want to validate.

const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

router.get("/:pid", placesControllers.getPlaceById);

router.get("/user/:uid", placesControllers.getPlacesByUserId);

//you can register multiple middlewares on the same http method path combination!
//They will simply be executed from left to right in your arguments.
//Or, you can also group them into an array.

//above, all can access. below, only authenticated with token can access.

router.use(checkAuth);

router.post("/", fileUpload.single("image"), [
  check("title").not().isEmpty(),
  check("description").isLength({ min: 5 }),
  check("address").not().isEmpty(),
  placesControllers.createPlace,
]);

router.patch("/:pid", [
  check("title").not().isEmpty(),
  check("description").isLength({ min: 5 }),
  placesControllers.updatePlace,
]);

router.delete("/:pid", placesControllers.deletePlace);

//the thing that we export in this file is the router object. in nodejs syntax
module.exports = router;
