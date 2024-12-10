// controllers/SubcatController.js

import Subcat from '../models/Subcat';
import path from 'path';
import fs from 'fs';

// Helper function to upload image
const uploadImage = (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;
  const uploadPath = path.join(__dirname, '../uploads', fileName);

  // Move the uploaded file to the "uploads" directory
  file.mv(uploadPath, (err) => {
    if (err) throw err;
  });

  return `/uploads/${fileName}`; // Returning the path that can be stored in DB
};

// Create a new subcategory
const createSubcat = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Subcategory name is required' });
    }

    // Handling the image file if it exists
    let imageUrl = null;
    if (req.files && req.files.image) {
      const file = req.files.image;
      imageUrl = uploadImage(file);
    }

    // Create the subcategory
    const subcat = await Subcat.create({
      name,
      image: imageUrl,
    });

    res.status(201).json({
      message: 'Subcategory created successfully',
      subcategory: subcat,
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({
      message: 'Error creating subcategory',
      error: error.message,
    });
  }
};

// Get all subcategories
const getAllSubcats = async (req, res) => {
  try {
    const subcats = await Subcat.findAll();
    res.status(200).json(subcats);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      message: 'Error fetching subcategories',
      error: error.message,
    });
  }
};

// Get a single subcategory by ID
const getSubcatById = async (req, res) => {
  try {
    const subcat = await Subcat.findByPk(req.params.id);
    if (!subcat) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    res.status(200).json(subcat);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({
      message: 'Error fetching subcategory',
      error: error.message,
    });
  }
};

// Update a subcategory
const updateSubcat = async (req, res) => {
  try {
    const { name } = req.body;
    const subcat = await Subcat.findByPk(req.params.id);

    if (!subcat) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    if (name) {
      subcat.name = name;
    }

    // Handle the image update if a new image is uploaded
    if (req.files && req.files.image) {
      const file = req.files.image;
      subcat.image = uploadImage(file);
    }

    await subcat.save();
    res.status(200).json({ message: 'Subcategory updated successfully', subcategory: subcat });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      message: 'Error updating subcategory',
      error: error.message,
    });
  }
};

// Delete a subcategory
const deleteSubcat = async (req, res) => {
  try {
    const subcat = await Subcat.findByPk(req.params.id);
    if (!subcat) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    // Delete the image file from the server if it exists
    if (subcat.image) {
      const imagePath = path.join(__dirname, '../uploads', subcat.image.split('/')[2]);
      fs.unlinkSync(imagePath); // Delete the image file
    }

    await subcat.destroy();
    res.status(200).json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      message: 'Error deleting subcategory',
      error: error.message,
    });
  }
};

export { createSubcat, getAllSubcats, getSubcatById, updateSubcat, deleteSubcat };
