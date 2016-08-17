var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

function Participant(id, communicator) {
	// Unique among all game participants
	this.id = id;
	// communicator is probably User-object
	this.communicator = communicator;

	this.makeMove = function() {
		return Promise.resolve('e4').delay(1000);
	}

	this.msg = function(msg) {
		console.log(chalk.dim('MSG in ' + this.id + ": " + msg.msg))
	}
}

module.exports = Participant;