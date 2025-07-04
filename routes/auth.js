const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const passport = require('passport')
const User = require('../models/User')

// Register
router.get('/register', (req, res) => res.render('register'))
router.post('/register', async (req, res) => {
    const { email, password, password2 } = req.body
    let errors = []
    if (!email || !password || !password2) errors.push({ msg: 'Compilare tutti i campi' })
    if (password !== password2) errors.push({ msg: 'Le password non coincidono' })
    if (errors.length) return res.render('register', { errors, email })

    try {
        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            errors.push({ msg: 'Email già registrata' })
            return res.render('register', { errors, email })
        }
        // TODO Change salt
        const hash = await bcrypt.hash(password, 10)
        const user = new User({ email: email.toLowerCase(), password: hash })
        await user.save()
        res.redirect('/login')
    } catch (err) {
        res.render('register', { errors: [{ msg: 'Errore server' }], email })
    }
})

// Login
router.get('/login', (req, res) => res.render('login'))
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
}))

// Logout
router.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return next(err)
        res.redirect('/login')
    })
})

module.exports = router