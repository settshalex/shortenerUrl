const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const User = require('../models/User')

module.exports = passport => {
    passport.use(new LocalStrategy({ usernameField: 'email' },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ where: { email: email.toLowerCase() }})
                if (!user) return done(null, false, { message: 'Email non registrata' })
                const match = await bcrypt.compare(password, user.password)
                if (!match) return done(null, false, { message: 'Password errata' })
                return done(null, user)
            } catch (err) { return done(err) }
        }
    ))

    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findByPk(id)
            done(null, user)
        } catch (err) {
            done(err)
        }
    })
}
