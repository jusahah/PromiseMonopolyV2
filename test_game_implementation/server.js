var _ = require('lodash');
var Promise = require('bluebird');
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');

// Domain deps
var Lobby = require('../Lobby');
var Participant = require('../ParticipantReal');

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var lobby = new Lobby();
var userCounter = 0;

// In test version all players share one socket
io.on('connection', function (socket) {
  socket.participants = {};	
  socket.on('user_create', function() {
  	userCounter++;
  	var playerID = 'p' + userCounter;
  	// Create socket communicator middle-man
  	var socketComm = new SocketCommunicator(socket, playerID);
  	socket.participants.playerID = socketComm;

  	var p = new Participant(playerID, socketComm);
  	lobby.playerJoinsLobby(p);

  	socket.emit('user_created', {id: playerID});
  })

  socket.on('msg', function(msg) {
  	var playerID = msg.fromplayer;

  	if (_.has(socket.participants, playerID)) {
  		socket.participants[playerID].receiveMsg(msg);
  	} else {
  		console.error("ERROR: Message to a non-existing player");
  	}

  })

  socket.on('user_left', function() {

  })

});


function SocketCommunicator(socket, playerID) {
	this.playerID = playerID;
	this.socket = socket;

	this.pendingResolve;

	this.msg = function(msg) {
		this.socket.emit('msg', {
			toplayer: this.playerID,
			topic: 'msg',
			msg: msg
		});		
	}

	this.makeMove = function() {
		var prom = new Promise(function(resolve, reject) {
			this.socket.emit('msg', {
				toplayer: this.playerID,
				topic: 'makeMove'
			});

			this.pendingResolve = resolve;

		}.bind(this))
	}

	this.receiveMsg = function(msg) {

		if (msg.topic === 'newMove') {
			return this.receiveMove(msg.move);
		}

	}

	this.receiveMove = function(move) {
		if (this.pendingResolve) {
			this.pendingResolve(move);
			this.pendingResolve = null;
		}
	}
}
