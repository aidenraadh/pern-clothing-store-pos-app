'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static getTypes(){
      return {
        '1': 'regular',
        '2': 'storage'
      }
    }
  };
  Store.init({
    name: DataTypes.STRING(100),
    owner_id: DataTypes.BIGINT,
    type_id: DataTypes.SMALLINT,
  }, {
    sequelize,
    modelName: 'Store',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',    
    deletedAt: 'deleted_at',   
  });
  return Store;
};