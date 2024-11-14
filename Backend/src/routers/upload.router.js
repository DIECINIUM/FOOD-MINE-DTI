import { Router } from 'express';
import admin from '../middleware/admin.mid.js';
import multer from 'multer';
import handler from 'express-async-handler';
import { BAD_REQUEST } from '../constants/httpStatus.js';
import { configCloudinary } from '../config/cloudinary.config.js';

const router = Router();
const upload = multer();

router.post(
  '/',
  admin,
  upload.single('image'),
  handler(async (req, res) => {
    const file = req.file;

    if (!file) {
      return res.status(BAD_REQUEST).send({ message: 'Image file is required' });
    }

    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadImageToCloudinary(req.file?.buffer);
      
      // Respond with image URL
      res.status(200).send({ imageUrl });
    } catch (error) {
      // Handle Cloudinary upload error
      res.status(500).send({ message: 'Error uploading image to Cloudinary', error: error.message });
    }
  })
);

// Cloudinary upload function
const uploadImageToCloudinary = imageBuffer => {
  const cloudinary = configCloudinary();

  return new Promise((resolve, reject) => {
    if (!imageBuffer) reject('No image buffer provided');

    cloudinary.uploader
      .upload_stream((error, result) => {
        if (error || !result) reject(error ? error : 'Cloudinary upload failed');
        else resolve(result.url);
      })
      .end(imageBuffer);
  });
};

export default router;
