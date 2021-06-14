const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    host:'/',
    proxied: true
})

let x
let arrayyy
let answerSmashArray = [];
//gets JSON object
fetch(`/database`)
    .then(response => response.json())
    .then(data => {
        x = data
}).then( () => {
    let lengthArray = x.AnswerSmash.length

    let numberGenerator = function(arr) { //Generates random number array with the length of the answersmash
        if (arr.length >= lengthArray) return;
        let newNumber = Math.floor(Math.random() * lengthArray);
        if (arr.indexOf(newNumber) < 0) {
            arr.push(newNumber);
        }
        numberGenerator(arr);
    };

    numberGenerator(answerSmashArray);
    console.log(answerSmashArray)
})



let state = {}

let myStream;

let playersReader = 0
const startButton = document.getElementById('start-button')
startButton.textContent = "Waiting for Players. 0 players are ready."
const readyButton = document.createElement('button')
readyButton.id = "readyButton"
readyButton.textContent = "Ready?" 
const scoreContainer = document.getElementById('score-container')
const name = prompt("What is your name?") 
const buzzer = document.createElement('button')
let nextQuestion = document.createElement('button')
nextQuestion.textContent = "Next Question"
nextQuestion.id = "next_question"
const playerName = document.getElementById('name-user')
const muteButton = document.getElementById('mute')


function addDescription(text) {//Method to add text to answersmash game
    let answerSmashDescription = document.createElement('p')
    answerSmashDescription.id = "description"
    answerSmashDescription.textContent = text
    answerSmashDescription.style.zIndex = "999"
    answerSmashDescription.style.position = "absolute"
    answerSmashDescription.style.marginLeft = "750px"
    answerSmashDescription.style.marginTop = "150px"
    answerSmashDescription.style.fontSize = "20px"

    document.getElementById("body").appendChild(answerSmashDescription)
}
//method to mute stream audio
muteButton.addEventListener('click', () =>{
    myStream.getAudioTracks()[0].enabled = !(myStream.getAudioTracks()[0].enabled)
    if(myStream.getAudioTracks()[0].enabled){
        muteButton.style.background = "url(/mute.png)"//swaps photo around, depending if muted or not
    }
    else{
        muteButton.style.background = "url(/unmute.png)"
    }
})

let countRounds = 0

let audio = new Audio("clapping.mp3")
let introMusic = new Audio("introMusic.mp3")
let buzzerAudio = new Audio("buzzer.mp3")

function playBuzzer(){
    buzzerAudio.pause()
    buzzerAudio.src = "buzzer.mp3"
    buzzerAudio.volume = 0.05
    buzzerAudio.play()

}
function playIntro(){
    introMusic.volume = 0.2

    introMusic.play()
    setInterval(function() {
        introMusic.pause()
        introMusic.src = "introMusic.mp3"
    }, 9000)
    setInterval(function fade(){ //method to fade out end of audio (after 6000 ms)
        if(introMusic.volume > 0){
            introMusic.volume = Math.max(introMusic.volume - 0.003, 0)
            setTimeout(fade, 20)
        }else{
            introMusic.pause()
            introMusic.src = "introMusic.mp3"
            return
        }
    }, 6000)
}


function playClapping(){
    audio.pause()
    audio.src = "clapping.mp3"
    audio.volume = 0.2

    audio.play()

}

startButton.disabled = true
let buzzerArray = []
let clientArray = ["host"]
let clientArray1 = ["Host"] 
let ID = 0

let game 
let questionNo


//NEXT QUESTION
nextQuestion.addEventListener('click', () => {
    if(countRounds < 5){ //if still answersmash game
        questionNo = answerSmashArray[countRounds]///pick random number
    }
    //else if(count)
    const buttons = document.getElementById('button-container').children//enable all buttons
    for(i = 0; i < buttons.length; i++){
        buttons[i].disabled = false
    }
    socket.emit('next-question', questionNo, game)
})
socket.on('question-next', (questionNo, game) => {

    let images = document.getElementsByTagName('img')
    if(!!document.getElementById('description')){ //removes description from answersmash
        document.getElementById('description').parentNode.removeChild(document.getElementById('description'))

    }

    if(countRounds == 5){ //Display Graphics after round 5
        if(images[0] != null){
            images[0].parentNode.removeChild(images[0])
        }
        title_input = "Where Is Kazakstan"
        afterq6()
    }
    else{ //if ANSWERSMASH
        if(images[0] != null){
            images[0].parentNode.removeChild(images[0])//remove image
        }
        state.animate_nq()


        setTimeout(function(){ //adds Image and Description
            addImageLeft(x.AnswerSmash[questionNo].item1.image, x.AnswerSmash[questionNo].item2.description)
        }, 2500)//calls function to add photo and description

    }

    countRounds++


    const players = document.getElementsByClassName('player')
    for(i = 0; i < players.length; i++){
        players[i].textContent = clientArray1[i + 1]//create/update leaderboard
        players[i].style.color = "black"
        playerClickedNo = 0
    }
    if(ID != 0){
        const buzzers = document.getElementById('score-container').children//enabled buzzers again after round is over
        for(i = 0; i < buzzers.length; i++){
            buzzers[i].disabled = false
        }
    }

})
//BUZZER
buzzer.addEventListener('click', () => {
    socket.emit('buzzer-clicked', ID)
    buzzer.disabled = true
})
let playerClickedNo = 0
socket.on('clicked-buzzer', identity => {
    playBuzzer()
    const buzzedPlayer = document.getElementById(identity) //sets player who buzzed = to if they were the first second or third to buzz in
    if(playerClickedNo == 0){
        playerClickedNo++
        buzzedPlayer.textContent = buzzedPlayer.textContent + '      1'
        buzzedPlayer.style.color = 'white'
    }
    else if(playerClickedNo == 1){
        playerClickedNo++
        buzzedPlayer.textContent = buzzedPlayer.textContent + '      2'
        buzzedPlayer.style.color = 'white'    }
    else if(playerClickedNo == 2){
        playerClickedNo++
        buzzedPlayer.textContent = buzzedPlayer.textContent + '      3'
        buzzedPlayer.style.color = 'white'    }

})
//READY BUTTON
readyButton.addEventListener('click', () =>{ //sends user name, and player no. (order which joined)
    clientArray1[ID] = name
    socket.emit('user-ready', name, ID)
    readyButton.textContent = "Waiting for host to Start"
    readyButton.disabled = true
    buzzer.className = "buzzer"
    buzzer.textContent = "BUZZER"
    playerName.textContent = "Player Name: " + name

})
socket.on('ready-user', (name, ID) => {
    clientArray1[ID] = name
    playersReader++
    startButton.textContent = "Waiting for Players. " + playersReader + " player/s is/are ready."
    if(playersReader == (clientArray.length - 1)){
        startButton.disabled = false //gives start button image, and enables start buttton
        startButton.textContent = "START"//only if all players are ready
        startButton.style.background = "url(LOGO.jpg)"
        startButton.style.backgroundPosition = "center"
        startButton.style.height = "100px"
        startButton.style.width = "100px"
        startButton.style.color = "white"
        startButton.style.fontSize = "20px"
    }
})
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}


const leaderBoard = document.getElementById('score-board')
//CONNECT VIDEO 
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myStream = stream
    myStream.getAudioTracks()[0].enabled = false

    addVideoStream(myVideo, stream) //add own stream

    myPeer.on('call', call =>{ //someone else calls, get their call object
        call.answer(stream) //give our stream to caller
        const video = document.createElement('video')
        call.on('stream', userVideoStream => { //gets callers stream
            //host will not execute this code. if start button exists, remove it
            if(!!document.getElementById('start-button')){
                startButton.parentNode.removeChild(startButton)
                scoreContainer.appendChild(readyButton)//removes stuff not needed for players, but needed for host
                //muteButton.parentNode.removeChild(muteButton)
            }
            addVideoStream(video, userVideoStream) //puts callers stream onto webpage
        })
        ID = ID + 1
    })
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })
})
socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
    for(i = 0; i < clientArray.length; i++){ //removes disconnected user, and removes same user from array
        if(clientArray[i] == userId){
            clientArray.splice(i, 1)
        }
    }
})
myPeer.on('open', id =>{
    socket.emit('join-room', ROOM_ID, id) //on open event, emit a join room request
})
//START BUTTON
startButton.addEventListener('click', () => {

    socket.emit('start-game', clientArray1)
})
socket.on('game-started', array =>{
    playIntro()//music
    setup()//graphics
    if(ID == 0){
        playerName.textContent = "You are the Host"
    }
    if(!!document.getElementById('start-button')){
        startButton.parentNode.removeChild(startButton)
        scoreContainer.appendChild(nextQuestion)
    }
    if(!!document.getElementById('readyButton')){
        readyButton.parentNode.removeChild(readyButton)
    }
    clientArray1 = array
    const title = document.createElement('p')
    title.id = "leaderboardTitle"
    title.textContent = "LEADERBOARD "
    leaderBoard.appendChild(title)
    for(i = 1; i < clientArray1.length; i++){ // creates scoreboard for x many players
        const player = document.createElement('p')
        const score = document.createElement('p')

        score.id = clientArray1[i]
        score.textContent = 0
        player.id = i
        player.classList.add('player')
        player.textContent = clientArray1[i]

        leaderBoard.append(player)
        leaderBoard.append(score)
    }
    const buttons = document.getElementById('button-container').children
    if(ID != 0){
        scoreContainer.appendChild(buzzer)
    }
    for(i = 0; i < clientArray1.length - 1; i++){ // add user id to every button on host screen
        buttons.item(i).id = clientArray1[i + 1]
        buttons.item(i).textContent = "Increase " + clientArray1[i + 1] + "'s Score"
    }
})
//INCREASE SCORE
document.getElementById('button-container').addEventListener('click', e => {
    const id = e.target.getAttribute('id')
    if(e.target.classList == "score-increase-button"){
        socket.emit('increase-score', id) //if host clicks button, send id of button clicked
    }
    const buttons = document.getElementById('button-container').children
    for(i = 0; i < buttons.length; i++){
        buttons[i].disabled = true
    }
})
socket.on('score-increased', id => {
    playClapping()//audio
    
    const players = document.getElementById('score-board').children //if score increased event happens, 
    let nthChild = 0                                                //increase whoever id's score by 1
    for(i = 0; i < players.length; i ++){//finds player to increase
        if(players.item(i).id == id){
            nthChild = i
            console.log(nthChild)
        }
    }
    let y = parseInt(players.item(nthChild).textContent)
    y += 1 //increases score by one
    players.item(nthChild).textContent = y
})
//CONNECTION
function addVideoStream(video, stream) { //function called when adding stream to a video object
    video.srcObject = stream 
    video.addEventListener('loadedmetadata', () =>{
        video.play()
        
    })
    videoGrid.append(video)
}
const buttonContainer = document.getElementById('button-container')
function connectToNewUser(userId, stream) { //add people's video who join after you join
    clientArray.push(userId)

    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    const button = document.createElement('button')
    button.disabled = true
    button.classList.add('score-increase-button')

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
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


function addImageLeft(url, description){ //function to add image and description at the same time
    let img = document.createElement('img')
    let downloadingImage = new Image()
    downloadingImage.onload = function(){
        img.src = this.src
        addDescription(description)

    }
    downloadingImage.src = url
    img.style.width = "200px"
    img.style.height = "200px"
    img.style.zIndex = "99"
    img.style.position = "absolute"
    img.style.marginLeft = "440px"
    img.style.marginTop = "75px"
    img.style.borderRadius = "5px"
    document.getElementById('body').appendChild(img)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//bedir's STUFF



var myGamePiece;//declaring some variables
var scorep1="0";//used to be a counter for holding score
var btn_Sc1 = document.getElementById("Sc_1")
function setup(){//compartmentalized set up code can have extra code here

    startGame();
    //p1_dock.style.display="none";
}
function startGame() {
    myGamePiece = new component(30, 30, "rgba(220,9,16,255)", myGameArea.canvas.width*2.25, 175);//making instances of the component object
    innerSquare = new component(30, 30, "rgba(220,9,16,255)", myGameArea.canvas.width*2.25, 175);
    last_red_Square = new component(30, 30, "rgba(220,9,16,255)", myGameArea.canvas.width*2.25, 175);
    blue_square = new component(30, 30, "rgba(14,190,213,255)", myGameArea.canvas.width*2.25, 175);
    q1_square = new component(90, 90, "rgba(220,9,16,255)", myGameArea.canvas.width*1.8, 175)
    q2_square = new component(90, 90, "rgba(220,9,16,255)", myGameArea.canvas.width*2.7, 175)
    myGameArea.start();
}



var myGameArea = {//canvas that allows for display
    canvas : document.createElement("canvas"),

    start : function() {
        this.canvas.width = screen.width;//adaptive display for all device screens
        this.canvas.height = screen.height*0.457;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, scoreContainer.nextSibling);//position on page
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 5);//infinitely carry out updategameare every 5 miliseconds
    },
    stop : function() {//cease the interval call
        clearInterval(this.interval);
    },    
    clear : function() {//clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    continue: function(){
        
        this.timeout=setTimeout(updateGameArea, 30);
    }
}
myGameArea.canvas.style.zIndex = "1"//positional values
myGameArea.canvas.style.position = "absolute"

function afterq6(){//after a number of questions the next round has to start so this is the resetter
    myGameArea.clear();
    blue_square.width=30;
    blue_square.height=30;
    blue_square.angle=0
    innerSquare.width=30;
    innerSquare.height=30;
    innerSquare.angle=0;
    myGamePiece.width=30;
    myGamePiece.height=30;
    myGamePiece.angle=0
    last_red_Square.width=30;
    last_red_Square.height=30;
    last_red_Square.angle=0   
    myGameArea.start();
}
function component(width, height, color, x, y) {//function constructor
    this.width = width;//applies the recieved parameters
    this.height = height;
    this.angle = 0;
    this.x = x;
    this.y = y;    
    this.update = function(a) {//runs without the parameter passed in
        ctx = myGameArea.context;//the parameter decides how to animate
        ctx.save();//save point for ctx.restore
        ctx.translate(this.x, this.y);//transformations/movements/modifications       
        ctx.rotate(this.angle);
        ctx.fillStyle = color;
        ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height);  
          
        if(a==2){//this is inner blue square
            ctx.lineWidth=10;
             ctx.strokeStyle="rgba(117,2,10,255)";   //this is inner border dark and thick
             ctx.strokeRect(this.width / -2, this.height / -2, this.width, this.height);
            ctx.lineWidth=10;
            ctx.strokeStyle="rgba(162,85,88,255)";
            ctx.strokeRect((this.width / -2), this.height / -2, this.width+4, this.height+4);
        }
        else if(a==3){//this is question box 1
            ctx.lineWidth=4;
            ctx.strokeStyle="rgba(216,133,54,255)";
            ctx.strokeRect((this.width / -2), this.height / -2, this.width, this.height);
            
        }
        else{//red square
            ctx.lineWidth=10;
            ctx.strokeStyle="rgba(117,2,10,255)";   //this is inner border dark and thick
            ctx.strokeRect(this.width / -2, this.height / -2, this.width, this.height);  
            ctx.lineWidth=10;
            ctx.strokeStyle="rgba(213,8,18,255)";
            ctx.strokeRect((this.width / -2), this.height / -2, this.width+4, this.height+4);
        }
        ctx.restore();    
    }
    this.insertTitle=function(left, top, size, text){//allows for insertion of text given reference points
        console.log("text add ran");
        ctx.font = size+"px Arial";
        ctx.fillStyle ="white";
        //ctx.textBaseline = "hanging";
        ctx.textAlign = "center";
        ctx.fillText(text, left, top);//fancy lettering to match the show
        ctx.strokeText(text, left, top);

    }
}
var title_input="Answer Smash!";
function updateGameArea() {
    if(blue_square.width>436){//using size helps for testing purposes if(blue_square.angle<-Math.PI*(3/4)could also be used
                               //this is the ending scenario where the animation is stopped
        myGameArea.stop();
        blue_square.insertTitle(blue_square.x, blue_square.y,55,title_input);
        //console.log("there is error at inserting title");
    }
    else{
        myGameArea.clear();//grow size and angle/clear and generate new drawings to animate
        myGamePiece.angle += 1 * Math.PI / 180;   
        myGamePiece.width+=3;
        myGamePiece.height+=3;
    
        myGamePiece.update(); 
        //console.log();
        if(myGamePiece.angle>Math.PI/2){
        
   
        innerSquare.angle += 1 * Math.PI / 180;     
        innerSquare.width+=3;
        innerSquare.height+=3;
         // console.log(innerSquare.x);
        // console.log("there is inf loop here at the rotation of red square");
        innerSquare.update(); 
        if(innerSquare.angle>Math.PI/2){//start animating the last red square
            last_red_Square.angle += 1 * Math.PI / 180;   
            last_red_Square.width+=3;
            last_red_Square.height+=3;
            //  console.log("last_red_Square is erroring here");
            console.log("there is inf loop here");
            last_red_Square.update(); 
                 if(last_red_Square.angle>Math.PI/2){//start animating the blue square
                    blue_square.angle -= 1 * Math.PI / 180;   
                    blue_square.width+=3;
                    blue_square.height+=3;
                   //   console.log(blue_square.width);
                  // console.log("animating the blue square is errored");
                    blue_square.update(2);     
                    //console.log("there is inf loop here");             
                }
        }
    } 
}

var tt=1;//transformation timer that acts as a flag

state = {//using the initialised variable above so that timer can be accesed as avariables in a  function cannot
    animate_nq: function (){
        q1_square.width = 0
        q1_square.height = 0
        q1_square.angle = 2
        
        q2_square.width = 0
        q2_square.height = 0
        q2_square.angle = 2

        console.log("animating next q");
        tt=1;//allowing subsequent presses of the button to start from step 1
        innerSquare.update();
        q1_square.update(3);
        var q1_timer = setInterval(q1_setup, 10);//start the animation, this is the timer that has to be cleared
        // q1_square.angle=-0.017453292519943295;
        //q2_square.angle=-0.017453292519943295;
        console.log(q1_square.angle);
    }
}


function q1_setup(){
    if(q1_square.angle>-(Math.PI/2)&&tt==1)//flags
    {
    q1_square.angle-= 1 * Math.PI / 180;//make sure to put angle first then size
    q1_square.width+=1;
    q1_square.height+=1;

    innerSquare.update();//updating background to imitate animation instead of clearing.//as clering clears the whole thing
    q1_square.update(3);//updating both squares here is the trick to get rid of remaining border
    console.log(q1_square.angle);
    }
    else if(q1_square.angle<=(-Math.PI/2)&&tt==1){
    console.log("there is inf loop here");
    clearInterval(state.q1_timer);//stop the first animation
    tt++;//make sure the first flag is set to false by increasing tt
    q2_square.update(3);
    var q2_timer = setInterval(q2_setup, 5)//start the next animation
    }
}
     function q2_setup(){//similar to q1 setup
         if(q2_square.angle>-(Math.PI/2)&&tt==2)
         {
            q2_square.angle-= 1 * Math.PI / 180;//make sure to put angle first then size
            q2_square.width+=1;
            q2_square.height+=1;
            innerSquare.update();//updating both squares here is the trick to get rid of remaining border
            q1_square.update(3);
            q2_square.update(3);
         }
         else if(q2_square.angle<=(-Math.PI/2)&&tt==2){//experimenting with showing images
            tt=0;
            clearInterval(q1_setup.q2_timer);
            console.log("there is inf loop here");          
            image_setup_on_q2();
        setTimeout(image_setup_on_q3(), 10000);
         }
     }
     function image_setup_on_q2(){
//   var img = document.getElementById("scream");

//   img.src="http://commons.wikimedia.org/wiki/Special:FilePath/Amazon%20Kindle%203.JPG";
//   ctx.drawImage(img, 10, 10);
//   console.log("img worked");
}
function image_setup_on_q3(){

// var img = document.getElementById("scream2");
// //img.width=img.width;
// //img.height=img.height;
// img.x=q1_square.x;

// img.src="http://commons.wikimedia.org/wiki/Special:FilePath/President%20Barack%20Obama.jpg";
// ctx.drawImage(img, 10, 10);
// console.log("img worked");
}

    startButton.onclick=function(){//event that starts the round
    var timerId = setInterval(nextRound, 5)
    }


    var n_R_Counter=0;
    function nextRound(){
       
       if(n_R_Counter>=100 && n_R_Counter<101){//uses a counter as a flag to zoom in/ stops after 100 updates
        innerSquare.update();
        console.log(n_R_Counter);
        n_R_Counter++;//counter increase once per loop
        clearInterval(startButton.timerId);
       }
       else if(n_R_Counter<100){
            innerSquare.width++;//size increase by 1 per update
            innerSquare.height++;
            innerSquare.update();
            blue_square.width-=4.5;//size decrease by 4.5 per update
            blue_square.height-=4.5;
            
            blue_square.update(2);
            //console.log("tried to play with size")
            n_R_Counter++;
           // console.log(n_R_Counter+"is the zoom counter");
            console.log("minimizer");
       }
       // clearInterval(this.interval);
    }

}
  
