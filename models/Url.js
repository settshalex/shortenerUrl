const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const User = require('./User')

const Url = sequelize.define('Url', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    originalUrl: { type: DataTypes.TEXT,    allowNull: false },
    shortId:     { type: DataTypes.STRING,  allowNull: false, unique: true },
    customCode:  { type: DataTypes.STRING,  unique: true },
    expiresAt:   { type: DataTypes.DATE },
    clicks:      { type: DataTypes.INTEGER, defaultValue: 0 }
})

// Relazione 1:N
Url.belongsTo(User, { foreignKey: { allowNull: false }})
User.hasMany(Url)

module.exports = Url
