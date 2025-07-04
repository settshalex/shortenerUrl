const { sequelize } = require('../app')

beforeAll(async () => {
    await sequelize.sync({ force: true })   // partiamo col DB pulito
})

afterAll(async () => {
    await sequelize.close()
})
