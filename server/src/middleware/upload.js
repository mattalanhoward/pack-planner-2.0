// server/src/middleware/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gear-list-backgrounds",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 2000, height: 2000, crop: "limit" }],
  },
});

// cap at 5 MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
