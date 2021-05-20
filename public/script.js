const socket = io('/')
const videoGrid = document.getElementById('video-grid')
let myPeer = new Peer(undefined, {
    host:'/',
    port: '3001',
    debug: true,
    config: { 'iceServers': [
        { 'url': 'stun:stun.l.google.com:19302' },  
        { url: 'stun:stun01.sipphone.com' },
    { url: 'stun:stun.ekiga.net' },
    { url: 'stun:stunserver.org' },
    { url: 'stun:stun.softjoys.com' },
    { url: 'stun:stun.voiparound.com' },
    { url: 'stun:stun.voipbuster.com' },
    { url: 'stun:stun.voipstunt.com' },
    { url: 'stun:stun.voxgratia.org' },
    { url: 'stun:stun.xten.com' },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
    url: 'turn:192.158.29.39:3478?transport=tcp',
    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    username: '28224511:1379330808'
    }

    ]}
})
const startButton = document.getElementById('start-button')
const readyButton = document.createElement('button')
readyButton.id = "readyButton"
readyButton.textContent = "Ready?" 
const scoreContainer = document.getElementById('score-container')
const name = prompt("What is your name?") 
const playersReady = document.createElement('h3')
let noOfPlayers = document.createElement('h3')
scoreContainer.appendChild(playersReady)
scoreContainer.appendChild(noOfPlayers)
noOfPlayers.textContent = 0
playersReady.textContent = "Players Ready: "

startButton.disabled = true


//ID for every client
let clientArray1 = ["Host"] //array for people

let clientArray = []
let ID = 0

readyButton.addEventListener('click', () =>{ //sends user name, and player no. (order which joined)
    socket.emit('user-ready', name, ID)
    readyButton.textContent = "Waiting for host to Start"
    readyButton.disabled = true
})
socket.on('ready-user', (name, ID) => {
    clientArray1[ID] = name
    let i = parseInt(noOfPlayers.textContent)
    i++
    noOfPlayers.textContent = i
    if(i == clientArray1.length - 1){
        startButton.disabled = false
    }
})

const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

const leaderBoard = document.getElementById('score-board')

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {

    addVideoStream(myVideo, stream)

    myPeer.on('call', call =>{
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            //host will not execute this code. if start button exists, remove it
            if(!!document.getElementById('start-button')){
                startButton.parentNode.removeChild(startButton)
                scoreContainer.appendChild(readyButton)
                noOfPlayers.parentNode.removeChild(noOfPlayers) //removes stuff not needed for players, but needed for host
                playersReady.parentNode.removeChild(playersReady)
            }
            addVideoStream(video, userVideoStream)

        })
        ID = ID + 1
    })

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)

    })
})
socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
})
myPeer.on('open', id =>{
    socket.emit('join-room', ROOM_ID, id)
})




startButton.addEventListener('click', () => {
    noOfPlayers.parentNode.removeChild(noOfPlayers)
    playersReady.parentNode.removeChild(playersReady)
    socket.emit('start-game', clientArray)
})

socket.on('game-started', array =>{
    if(!!document.getElementById('readyButton')){
        readyButton.parentNode.removeChild(readyButton)
    }
    clientArray = []
    clientArray = array
    for(i = 1; i < clientArray1.length; i++){ // creates scoreboard for x many players

        const player = document.createElement('p')
        const score = document.createElement('p')

        score.id = clientArray1[i]
        score.textContent = "0"
        player.textContent = clientArray1[i]

        leaderBoard.append(player)
        leaderBoard.append(score)
        
    }
    const buttons = document.getElementById('button-container').children

    for(i = 0; i < clientArray1.length - 1; i++){ // add user id to every button on host screen
        buttons.item(i).id = clientArray1[i + 1]
        buttons.item(i).textContent = "Increase " + clientArray1[i + 1] + "'s Score"
    }
    startButton.parentNode.removeChild(startButton)

    // let userName = ""
    // for(i = 0; i < clientArray.length - 1; i ++){
    //     if(ID == clientArray[i]){
    //         userName = i
    //         break
    //     }
    // }
    // ID = userName
})

document.getElementById('button-container').addEventListener('click', e => {
    const id = e.target.getAttribute('id')
    socket.emit('increase-score', id) //if host clicks button, send id of button clicked
})
socket.on('score-increased', id => {
    const players = document.getElementById('score-board').children //if score increased event happens, 
    let nthChild = 0                                                //increase whoever id's score by 1
    for(i = 0; i < players.length; i ++){
        if(players.item(i).id == id){
            nthChild = i
            console.log(nthChild)
        }
    }

    let y = parseInt(players.item(nthChild).textContent)
    y += 1
    players.item(nthChild).textContent = y
    
})


function addVideoStream(video, stream) {

    video.srcObject = stream
    video.addEventListener('loadedmetadata', () =>{
        video.play()
    })
    videoGrid.append(video)
}

function connectToNewUser(userId, stream) {

    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')

    const button = document.createElement('button')
    const buttonContainer = document.getElementById('button-container')

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
        clientArray.push(userId)

        if(!!document.getElementById('start-button')){ // only host will come here
            button.innerHTML = "Increase Score"        //if start button exists, add buttons for seperate users
            buttonContainer.append(button)
        }
    })
    call.on('close', () => {
        video.remove()
        button.parentNode.removeChild(button) //remove button if user leaves
    })

    peers[userId] = call
}