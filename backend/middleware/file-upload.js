const multer = require("multer");
const uuid = require("uuid");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const fileUpload = multer({
  limits: 500000,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      //derive the path!
      cb(null, "uploads/images");
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype]; //extract the right extension.
      cb(null, uuid.v4() + "." + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    //!! converts undefined to false.
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error("Invalid mime type!");
    //if is valid is true, then we pass it on.
    cb(error, isValid);
  },
});

module.exports = fileUpload;
