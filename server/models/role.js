'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Role.init({
    name: DataTypes.STRING(20)
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',    
    deletedAt: 'deleted_at',     
  });
  return Role;
};