'use strict';

const {Op}   = require("sequelize")
const models = require('../../models/index')
const Role   = models.Role
const Owner  = models.Owner
const bcrypt = require('bcrypt')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const currentTime = new Date()
    // Get the first owner
    const owner = await Owner.findOne({attributes: ['id']})

    // Get the owner role
    const ownerRole = await Role.findOne({
      where: {name: {[Op.iLike]: `owner`}},
      attributes: ['id']
    })

    // Get the employee role
    const employeeRole = await Role.findOne({
      where: {name: {[Op.iLike]: `employee`}},
      attributes: ['id']
    })

    const users = [
      {
        name: 'Test owner', email: 'testowner@gmail.com',
        password: await bcrypt.hash('12345678', 10),
        role_id: ownerRole.id, owner_id: owner.id,
        created_at: currentTime,
        updated_at: currentTime          
      },    
      {
        name: 'Test employee', email: 'testemployee@gmail.com',
        password: await bcrypt.hash('12345678', 10),
        role_id: employeeRole.id, owner_id: owner.id,
        created_at: currentTime,
        updated_at: currentTime          
      },       
    ]
    await queryInterface.bulkInsert('Users', users);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
