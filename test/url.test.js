const request = require('supertest')
const { app } = require('../app')

let agent

beforeAll(async () => {
    agent = request.agent(app)
    // registra e login
    await agent.post('/register').send({ email:'e@f.com', password:'pwd', password2:'pwd' })
    await agent.post('/login').send({ email:'e@f.com', password:'pwd' })
})

describe('URL', () => {
    it('POST /shorten crea un URL e mostra in dashboard', async () => {
        const res = await agent
            .post('/shorten')
            .send({ originalUrl:'https://example.com' })
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe('/dashboard')
        const dash = await agent.get('/dashboard')
        expect(dash.text).toContain('https://example.com')
    })

    it('Custom code duplicato → mostra errore', async () => {
        await agent.post('/shorten').send({ originalUrl:'u1', customCode:'ABC123' })
        const res2 = await agent.post('/shorten').send({ originalUrl:'u2', customCode:'ABC123' })
        expect(res2.text).toMatch(/Codice già in uso/)
    })

    it('Redirect breve → 302 al long URL', async () => {
        const gen = await agent.post('/shorten').send({ originalUrl:'https://ok.com' })
        const dash = await agent.get('/dashboard')
        const match = dash.text.match(/\/([A-Za-z0-9\-]{7})/)
        const shortId = match[1]
        const res = await request(app).get(`/${shortId}`)
        expect(res.status).toBe(302)
        expect(res.headers.location).toBe('https://ok.com')
    })

    it('Link scaduto → 410', async () => {
        const past = new Date(Date.now() - 1000*60).toISOString().slice(0,16)
        await agent.post('/shorten').send({ originalUrl:'x', expiresAt:past })
        const dash = await agent.get('/dashboard')
        const m = dash.text.match(/href=".*\/([A-Za-z0-9\-]+)"/)
        const id = m[1]
        const res = await request(app).get(`/${id}`)
        expect(res.status).toBe(410)
    })
})
