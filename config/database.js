const { Sequelize } = require('sequelize')
const sequelize = new Sequelize(process.env.PG_URI, {
    dialect: 'postgres',
    logging: false
})
module.exports = sequelize
