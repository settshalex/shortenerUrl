
const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')
const User = require('./User')
const { QueryTypes } = require('sequelize')

const Url = sequelize.define('Url', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    originalUrl: { type: DataTypes.TEXT,    allowNull: false },
    shortId:     { type: DataTypes.STRING,  allowNull: false, unique: true },
    customCode:  { type: DataTypes.STRING,  unique: true },
    expiresAt:   { type: DataTypes.DATE },
    clicks:      { type: DataTypes.INTEGER, defaultValue: 0 }
})

async function getDailyClicks(urlId) {
    const sql = `
    SELECT
      gs.day::date   AS day,
      COALESCE(c.clicks, 0) AS clicks
    FROM generate_series(
           current_date - interval '6 days',
           current_date,
           interval '1 day'
         ) AS gs(day)
    LEFT JOIN (
      SELECT
        date_trunc('day', at)::date AS day,
        count(*)                   AS clicks
      FROM "Clicks"
      WHERE url_id = :urlId
        AND at >= current_date - interval '6 days'
      GROUP BY day
    ) AS c ON c.day = gs.day
    ORDER BY gs.day;
  `;

    // rows = [ { day: '2025-06-30', clicks: 5 }, ... ]
    return await sequelize.query(sql, {
        type: sequelize.QueryTypes.SELECT,
        replacements: {urlId}
    });
}

// Relazione 1:N
Url.belongsTo(User, { foreignKey: { allowNull: false }})
User.hasMany(Url)

module.exports = Url
