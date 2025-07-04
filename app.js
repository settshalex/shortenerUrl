require('dotenv').config()
const express = require('express')
const http = require('http')
const session = require('express-session')
const PgSession = require('connect-pg-simple')(session)
const passport = require('passport')
const path = require('path')
const { Server } = require('socket.io')
const sequelize = require('./config/database')

// Passport config
require('./config/passport')(passport)

const app = express()
const server = http.createServer(app)
const io = new Server(server)
// subito dopo app = express()
app.use(express.static(path.join(__dirname, 'public')));

// Test connessione Postgres
sequelize.authenticate().catch(console.error)

// EJS
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
// Body parser
app.use(express.urlencoded({ extended: false }))

// Session
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new PgSession({
    conString: process.env.PG_URI,
    tableName: 'session',              // nome della tabella
    createTableIfMissing: true         // la crea se non c’è
  }),
})
app.use(sessionMiddleware)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

sequelize.sync({ force: false  })

// Rendiamo io accessibile in route
app.set('io', io)

// Routes
app.use('/', require('./routes/auth'))
app.use('/', require('./routes/url'))

// 4) Fai “reuse” del middleware di sessione per il handshake di Socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next)
})

// 5) Controlla che l’utente sia autenticato prima di stabilire la connessione
io.use((socket, next) => {
  const req = socket.request
  // con Passport la sessione contiene passport.user
  if (req.session.passport && req.session.passport.user) {
    return next()
  }
  next(new Error('Unauthorized'))
})

// 6) Gestisci la connessione
io.on('connection', socket => {
  const userId = socket.request.session.passport.user
  socket.join(`${userId}`)
})

const PORT = process.env.PORT || 3030
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))


module.exports = { app, sequelize }
