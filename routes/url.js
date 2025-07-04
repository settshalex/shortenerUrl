const express = require('express')
const nanoid = require('nanoid')
const Url = require('../models/Url')
const Click = require('../models/Click')
const User = require('../models/User')
const QRCode = require('qrcode')
const router = express.Router()
// Middleware to check auth
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next()
    res.redirect('/login')
}

router.get('/expired', async (req, res) => {
    res.render('expired')
})

// Redirect short URL
router.get('/short/:shortId', async (req, res) => {
    const url = await Url.findOne({
        where: {
            [require('sequelize').Op.or]: [
                { shortId: req.params.shortId },
                { customCode: req.params.shortId }
            ]
        },
        include: User
    })
    if (!url || (url.expiresAt && url.expiresAt < Date.now())) {
        if (req.isAuthenticated()) {
            var string = encodeURIComponent('Short URL expired');
            return res.redirect('/?error=' + string)
        } else {
            return res.redirect('/expired')
        }

    }

    url.clicks++
    await url.save()
    if (Click) await Click.create({ UrlId: url.id })

    // emetti il nuovo conteggio al client dell’utente
    const io = req.app.get('io')
    io.to(url.User.id.toString()).emit('linkClick', {
        shortId: url.shortId,
        clicks: url.clicks,
        timestamp: new Date()
    })

    return res.redirect(url.originalUrl)
})

// Shorten form & dashboard list
router.get('/', ensureAuthenticated, async (req, res) => {
    const urls = await Url.findAll({
        where: { UserId: req.user.id },
        include: Click // se usi modello Click
    })
    const baseUrl = process.env.BASE_URL

    // genera QR e array daily
    const stats = await Promise.all(urls.map(async url => {
        // QR code data URL
        const shortLink = `${baseUrl}/short/${url.shortId}`
        const qr = await QRCode.toDataURL(shortLink)

        // daily clicks (ultimi 7 giorni)
        // Calcola la data di partenza: mezzanotte di 6 giorni fa
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - 6);

        const days = Array(7).fill(0);

        url.Clicks.forEach(({ at }) => {
            // Normalizza il click alla mezzanotte del suo giorno
            const clickDate = new Date(at);
            clickDate.setHours(0, 0, 0, 0);

            const diffMs = clickDate - since;
            const idx = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (idx >= 0 && idx < 7) {
                days[idx]++;
            }
        });

        return {
            id: url._id,
            shortId: url.shortId,
            originalUrl: url.originalUrl,
            customCode: url.customCode,
            expiresAt: url.expiresAt,
            clicks: url.clicks,
            qr,
            daily: days
        }
    }))
    const error = req.query.error
    res.render('dashboard', {
        user: req.user,
        urls: stats,
        baseUrl,
        errors: [error]
    })
})



// Handle URL shortening
// routes/url.js (estratto)
router.post('/shorten', ensureAuthenticated, async (req, res) => {
    let { originalUrl, customCode, expiresAt } = req.body

    // 1. Sanitize e validazione customCode: solo lettere, numeri e trattini
    if (customCode) {
        if (!/^[A-Za-z0-9\-]{3,30}$/.test(customCode)) {
            var string = encodeURIComponent('Codice non valido');
            res.redirect('/?error=' + string)
        }
        const exists = await Url.findOne({ $or: [ { shortId: customCode }, { customCode } ] })
        if (exists) {
            var string = encodeURIComponent('Codice già in uso');
            res.redirect('/?error=' + string)
            return
        }
    }

    // 2. Genera se non fornito
    const shortId = customCode || nanoid.nanoid(7)

    // 3. Parsing data di scadenza (facoltativa)
    let expiry = expiresAt ? new Date(expiresAt) : null

    await Url.create({
        originalUrl,
        shortId,
        customCode: customCode||null,
        expiresAt: expiry,
        UserId: req.user.id
    })
    res.redirect('/')
})



module.exports = router