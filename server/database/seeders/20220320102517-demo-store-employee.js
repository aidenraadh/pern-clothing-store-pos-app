'use strict';
const {Op}          = require("sequelize")
const models        = require('../../models/index')
const User          = models.User
const Store         = models.Store
const Role          = models.Role
const StoreEmployee = models.StoreEmployee


module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ownerId = 1

    // Get the employee role
    const employeeRole = await Role.findOne({
      where: {name: {[Op.iLike]: `%employee%`}},
      attributes: ['id']
    })

    const employeeUser = await User.findOne({where: {
      role_id: employeeRole.id,
      owner_id: ownerId
    }})

    const store = await Store.findOne({where: {owner_id: ownerId}})

    // Store the store employee
    await StoreEmployee.create({
      user_id: employeeUser.id, store_id: store.id
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Store_Employees', null, {});
  }
};
