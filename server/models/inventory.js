'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Inventory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.Inventory.hasMany(models.InventorySize, {foreignKey: 'inventory_id', as: 'sizes'})
    }
  };
  Inventory.init({
    name: DataTypes.STRING(100),
    owner_id: DataTypes.BIGINT.UNSIGNED,
  }, {
    sequelize,
    modelName: 'Inventory',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',    
    deletedAt: 'deleted_at', 
  });
  return Inventory;
};