const sequelize = require('../config/database')
const { QueryTypes } = require('sequelize')

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
        WHERE "UrlId" = :urlId
        AND at >= current_date - interval '6 days'
      GROUP BY day
    ) AS c ON c.day = gs.day
    ORDER BY gs.day;
  `
    return sequelize.query(sql, {
        type: QueryTypes.SELECT,
        replacements: { urlId }
    })
}

module.exports = { getDailyClicks }
