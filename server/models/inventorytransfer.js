'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InventoryTransfer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.InventoryTransfer.belongsTo(
        models.Inventory, {foreignKey: 'inventory_id', as: 'inventory'}
      )    
      models.InventoryTransfer.belongsTo(
        models.InventorySize, {foreignKey: 'inventory_size_id', as: 'inventorySize'}
      )              
      models.InventoryTransfer.belongsTo(
        models.Store, {foreignKey: 'origin_store_id', as: 'originStore'}
      )  
      models.InventoryTransfer.belongsTo(
        models.Store, {foreignKey: 'destination_store_id', as: 'destinationStore'}
      )       
    }
  };
  InventoryTransfer.init({
    inventory_id: DataTypes.BIGINT,
    inventory_size_id: DataTypes.BIGINT,
    amount: DataTypes.INTEGER,
    origin_store_id: DataTypes.BIGINT,
    destination_store_id: DataTypes.BIGINT,
    transfer_date: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'InventoryTransfer',
    tableName: 'inventory_transfers',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });
  return InventoryTransfer;
};