const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4:uuidV4 } = require('uuid')
const fs = require('fs')

//make every file in the /dashboard and /questions folders publicly accessable
app.use(express.static('./dashboard'))

//so that express can use json
app.use(express.json())

function loadDatabase(){
	return fs.existsSync('./dashboard/database.json') ? JSON.parse(fs.readFileSync('./database.json', 'utf-8')) : {} //loads the database into a variable
}

//sends the dashboard.html file when they goto /dashboard
app.get('/dashboard', (request, response) => {
	response.sendFile(`dashboard.html`, {root: __dirname + '/dashboard'})
})

//saves the request body as a json file
app.post('/dashboard', (request, response) => {
	const fileName = request.headers.filename
	const receivedJSON = request.body

	//adds to database
	let database = loadDatabase()//loads the database into a variable
	database[fileName] = receivedJSON //updates the relevant section of the database
	fs.writeFileSync('./dashboard/database.json', JSON.stringify(database)) //writes database to json file

	console.log('Database updated')
	response.send('Success')
})



////////////////////////////////////////////////////////
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

        socket.on('buzzer-clicked', id => {
            io.in(roomId).emit('clicked-buzzer', id)
        })

        socket.on('next-question', () => {
            io.in(roomId).emit('question-next')
        })

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