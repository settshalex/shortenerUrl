const request = require('supertest')
const { app } = require('../app')

describe('Auth', () => {
    it('POST /register → 302 redirect su /login', async () => {
        const res = await request(app)
            .post('/register')
            .send({ email:'a@b.com', password:'pass123', password2:'pass123' })
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe('/login')
    })

    it('POST /login con credenziali corrette', async () => {
        await request(app)
            .post('/register')
            .send({ email:'c@d.com', password:'xyz789', password2:'xyz789' })
        const res = await request(app)
            .post('/login')
            .send({ email:'c@d.com', password:'xyz789' })
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe('/dashboard')
    })

    it('GET /dashboard senza login → redirect /login', async () => {
        const res = await request(app).get('/dashboard')
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe('/login')
    })
})
