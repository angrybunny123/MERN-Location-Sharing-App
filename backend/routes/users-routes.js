//register the middleware responsible for handling routes related to places

const express = require("express");
const { check } = require("express-validator");

const fileUpload = require("../middleware/file-upload");
const usersController = require("../controllers/users-controllers");

const router = express.Router();

router.get("/", usersController.getUsers);

router.post("/signup", fileUpload.single("image"), [
  check("name").not().isEmpty(),
  check("email").normalizeEmail().isEmail(), //normalize: Test@test.com => test@test.com
  check("password").isLength({ min: 6 }),
  usersController.signup,
]);

router.post("/login", usersController.login);

//the thing that we export in this file is the router object. in nodejs syntax
module.exports = router;
