
import Cat from '../models/Cat.js';

export const createCategory = async (req, res) => {
  const { name, image, parentId, type } = req.body;
  try {
    const newCat = await Cat.create({ name, image, parentId, type });
    res.status(201).json({ message: 'Category created successfully', data: newCat });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category', details: error.message });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Cat.findAll({
      where: { parentId: null },
      include: { model: Cat, as: 'subcategories' },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Cat.findByPk(id, {
      include: { model: Cat, as: 'subcategories' },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category', details: error.message });
  }
};

export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, image, parentId, type } = req.body;
  try {
    const category = await Cat.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.update({ name, image, parentId, type });
    res.status(200).json({ message: 'Category updated successfully', data: category });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category', details: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Cat.findByPk(id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    await category.destroy();
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category', details: error.message });
  }
};
