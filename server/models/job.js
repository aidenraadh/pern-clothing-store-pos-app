'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Job extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static getStatuses(){
      return {
        '1': 'Processing',
        '2': 'Completed',
        '3': 'Failed'        
      }
    }
    static associate(models) {
      // define association here
    }
  };
  Job.init({
    user_id: DataTypes.BIGINT,
    model: DataTypes.TEXT,
    status: DataTypes.SMALLINT,
    result: DataTypes.SMALLINT,
  }, {
    sequelize,
    modelName: 'Job',
    tableName: 'jobs',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });
  return Job;
};