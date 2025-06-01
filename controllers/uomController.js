import UOM from '../models/UOM.js';

// Create one or more UOMs for a product
export const createUOM = async (req, res) => {
  try {
    const { product_id, uoms } = req.body;

    if (!product_id || !Array.isArray(uoms)) {
      return res.status(400).json({ message: 'product_id and uoms array are required.' });
    }

    const createdUOMs = await UOM.bulkCreate(
      uoms.map(u => ({ ...u, product_id }))
    );

    res.status(201).json(createdUOMs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating UOMs.' });
  }
};

// Get all UOMs for a product
export const getUOMsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const uoms = await UOM.findAll({ where: { product_id: productId } });
    res.status(200).json(uoms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching UOMs.' });
  }
};

// Update a UOM
export const updateUOM = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await UOM.update(req.body, { where: { id } });

    if (!updated) return res.status(404).json({ message: 'UOM not found.' });

    const updatedUOM = await UOM.findByPk(id);
    res.status(200).json(updatedUOM);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating UOM.' });
  }
};

// Delete a UOM
export const deleteUOM = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UOM.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ message: 'UOM not found.' });

    res.status(200).json({ message: 'UOM deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting UOM.' });
  }
};
