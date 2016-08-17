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
}

module.exports = Participant;