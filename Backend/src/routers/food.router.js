import { Router } from 'express';
import { FoodModel } from '../models/food.model.js';
import handler from 'express-async-handler';
import admin from '../middleware/admin.mid.js';
import uploadImageToCloudinary from './upload.router.js';
import { BAD_REQUEST } from '../constants/httpStatus.js';

const router = Router();

// Get all foods
router.get('/', handler(async (req, res) => {
  const foods = await FoodModel.find({});
  res.send(foods);
}));

// Create a new food item
router.post('/', admin, handler(async (req, res) => {
  const { name, price, tags, origins, cookTime } = req.body;

  if (!name || !price || !origins || !cookTime) {
    return res.status(400).send({ message: 'Missing required fields: name, price, origins, and cookTime are required' });
  }

  const img = req.file?.buffer;  // Ensure you're passing the buffer here
  if (!img) {
    return res.status(BAD_REQUEST).send({ message: 'Image file is required' });
  }

  try {
    const imageUrl = await uploadImageToCloudinary(img);  // Upload the image

    if (!imageUrl) {
      return res.status(BAD_REQUEST).send({ message: 'Error in uploading image on cloudinary' });
    }

    const processedTags = Array.isArray(tags) ? tags : tags ? tags.split(',') : [];
    const processedOrigins = Array.isArray(origins) ? origins : origins ? origins.split(',') : [];

    const food = new FoodModel({
      name,
      price,
      tags: processedTags,
      imgUrl: imageUrl,
      origins: processedOrigins,
      cookTime,
    });

    await food.save();
    res.status(201).send(food);

  } catch (error) {
    return res.status(BAD_REQUEST).send({ message: error.message || 'Unknown error during upload' });
  }
}));

// Update an existing food item
router.put('/', admin, handler(async (req, res) => {
  const { id, name, price, tags, favorite, imageUrl, origins, cookTime } = req.body;

  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ message: 'Invalid ObjectId' });
  }

  await FoodModel.updateOne(
    { _id: ObjectId(id) },
    {
      name,
      price,
      tags: Array.isArray(tags) ? tags : tags.split(','),
      favorite,
      imageUrl,
      origins: Array.isArray(origins) ? origins : origins.split(','),
      cookTime,
    }
  );

  res.status(200).send();  // OK status
}));

// Delete a food item
router.delete('/:foodId', admin, handler(async (req, res) => {
  const { foodId } = req.params;

  const result = await FoodModel.deleteOne({ _id: foodId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Food item not found.' });
  }

  res.status(200).send({ message: 'Food item deleted successfully.' });
}));

// Get all tags with their counts
router.get('/tags', handler(async (req, res) => {
  const tags = await FoodModel.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', count: '$count' } },
  ]).sort({ count: -1 });

  const all = {
    name: 'All',
    count: await FoodModel.countDocuments(),
  };

  tags.unshift(all);
  res.send(tags);
}));

// Search foods by name
router.get('/search/:searchTerm', handler(async (req, res) => {
  const { searchTerm } = req.params;
  const searchRegex = new RegExp(searchTerm, 'i');
  const foods = await FoodModel.find({ name: { $regex: searchRegex } }).limit(20);
  res.send(foods);
}));

// Get foods by tag
router.get('/tag/:tag', handler(async (req, res) => {
  const { tag } = req.params;
  const foods = await FoodModel.find({ tags: tag });
  res.send(foods);
}));

// Get a specific food by ID
router.get('/:foodId', handler(async (req, res) => {
  const { foodId } = req.params;
  const food = await FoodModel.findById(foodId);
  if (!food) {
    return res.status(404).json({ error: 'Food item not found.' });
  }
  res.send(food);
}));

export default router;
