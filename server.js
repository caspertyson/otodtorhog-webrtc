const express = require('express')
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4:uuidV4 } = require('uuid')

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.get('/', (req, res) =>{
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) =>{
    res.render('room', { roomId: req.params.room})
})

io.on('connection', socket=> {
    socket.on('join-room', (roomId, userId) =>{
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('user-connected', userId)


        socket.on('start-game', array => {
            io.in(roomId).emit('game-started', array)
        })

        socket.on('increase-score', id => {
            io.in(roomId).emit('score-increased', id)
        })

        socket.on('user-ready', (name, ID) => {
            socket.broadcast.to(roomId).emit('ready-user', name, ID)
        })

        socket.on('disconnect', () => {
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
    })
})




server.listen(3000)