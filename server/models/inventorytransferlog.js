'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InventoryTransferLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  InventoryTransferLog.init({
    inventory_id: DataTypes.BIGINT,
    inventory_size_id: DataTypes.BIGINT,
    amount: DataTypes.INTEGER,
    origin_store_id: DataTypes.BIGINT,
    destination_store_id: DataTypes.BIGINT,
    transfer_date: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'InventoryTransferLog',
    tableName: 'inventory_transfer_log',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });
  return InventoryTransferLog;
};