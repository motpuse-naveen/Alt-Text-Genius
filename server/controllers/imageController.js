// server/controllers/imageController.js
const multer = require("multer");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Google Cloud Vision API Logic
const getAltTextFromGoogle = async (filePath) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const imageBase64 = fs.readFileSync(filePath, "base64");

  const response = await axios.post(apiUrl, {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: "LABEL_DETECTION", maxResults: 1 }],
      },
    ],
  });

  const labels = response.data.responses[0].labelAnnotations;
  return labels.length > 0 ? labels[0].description : "No description available";
};

// Azure Computer Vision API Logic
const getAltTextFromAzure = async (filePath) => {
  const apiKey = process.env.AZURE_API_KEY;
  const endpoint = process.env.AZURE_ENDPOINT + "/vision/v3.1/describe";

  const image = fs.readFileSync(filePath);

  const response = await axios.post(endpoint, image, {
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/octet-stream",
    },
  });

  const captions = response.data.description.captions;
  return captions.length > 0 ? captions[0].text : "No description available";
};

const generateAltText = async (filePath, selectedApi) => {
  const useApi = selectedApi || process.env.USE_API || "google"; // Default to Google if not specified

  if (useApi === "google") {
    return await getAltTextFromGoogle(filePath);
  } else if (useApi === "azure") {
    return await getAltTextFromAzure(filePath);
  } else {
    throw new Error("Invalid API selection");
  }
};

// In the upload route
exports.uploadImage = (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const filePath = req.file.path;
      const altText = await generateAltText(filePath, req.body.api);
      res.json({ filePath, altText });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate alt-text" });
    }
  });
};
