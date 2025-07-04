const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const Url = require('./Url')

const Click = sequelize.define('Click', {
    at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
})

Click.belongsTo(Url, { foreignKey: { allowNull: false }})
Url.hasMany(Click)

module.exports = Click
