var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

var AlreadyDisconnected = require('./exceptions/AlreadyDisconnected')
var PlayerFlagged = require('./exceptions/PlayerFlagged');

var consoleColorers = {
	'A': chalk.bgGreen,
	'B': chalk.bgYellow,
	'C': chalk.bgBlue
}

var disconnectTimes = {
	'A': 14500,
	'B': 5500,
	'C': 11500
}

function Participant(id, communicator) {
	// Unique among all game participants
	this.id = id;
	// communicator is probably User-object
	this.communicator = communicator;

	// Has communicator been disconnected
	this.disconnected = false;

	// Tracks player's cumulative move clock
	this.timeleft = 2000;

	this.makeMove = function() {
		// Use communicator object to inform user and return Promise which
		// will eventually be resolved with user-supplied move

		// MOCK
		if (this.hasDisconnected()) {
			return Promise.reject(new AlreadyDisconnected());
		}
		var text = this.id + ' to MOVE';
		console.log(consoleColorers[this.id](text));
		return Promise.resolve('e4').delay(300 + Math.random()*350);
	}

	this.msg = function(msg) {
		var text = this.id + ': ' + msg.msg;
		console.log(consoleColorers[this.id](text));
		//console.log(chalk.dim('MSG in ' + this.id + ": " + msg.msg))
	}

	this.hasDisconnected = function() {
		return this.disconnected;
	}

	this.setGameTime = function(time) {
		this.timeleft = time;
	} 

	this.getGameTime = function() {
		return this.timeleft;
	}

	this.substractTime = function(movetime) {
		this.timeleft -= movetime;
		if (this.timeleft < 0) throw new PlayerFlagged();
	}

	setTimeout(function() {
		return; // Disable by uncommenting
		console.log("--- DISCONNECT " + this.id + " ---");
		this.disconnected = true;
	}.bind(this), disconnectTimes[this.id]);
}

module.exports = Participant;