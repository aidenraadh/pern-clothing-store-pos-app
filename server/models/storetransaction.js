'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StoreTransaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      models.StoreTransaction.belongsTo(
        models.Store, {foreignKey: 'store_id', as: 'store'}
      )
      models.StoreTransaction.hasMany(
        models.StoreTransactionInventory, {foreignKey: 'store_transaction_id', as: 'storeTrnscInvs', }
      )
    }
  };
  StoreTransaction.init({
    store_id: DataTypes.BIGINT,
    total_amount: DataTypes.INTEGER,
    total_cost: DataTypes.INTEGER,
    total_original_cost: DataTypes.INTEGER,
    transaction_date: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'StoreTransaction',
    tableName: 'store_transactions',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',    
    deletedAt: 'deleted_at',     
  });
  return StoreTransaction;
};