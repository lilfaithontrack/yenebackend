import CatItem from './CatItem.js';
import Subcat from './Subcat.js';

// Join table for many-to-many relationship
CatItem.belongsToMany(Subcat, {
  through: 'CatItem_Subcat', // Name of the join table
  as: 'subcats', // Alias for accessing associated Subcats
  foreignKey: 'catItemId',
});

Subcat.belongsToMany(CatItem, {
  through: 'CatItem_Subcat',
  as: 'catItems', // Alias for accessing associated CatItems
  foreignKey: 'subcatId',
});

export { CatItem, Subcat };
