var chalk = require('chalk');
var _ = require('lodash');

var currLevel = 0;
var history = [];

module.exports = {

	push: function() {
		currLevel++;
	},
	pop: function() {
		currLevel--;
	},

	log: function(msg) {
		history.push(_.repeat('-', currLevel) + chalk.inverse(msg));
	},
	log2: function(msg) {
		console.log(_.repeat('-', currLevel) + chalk.inverse(msg));
	},

	// We can use printTrace to do tests!
	// Instead of console logging we just return to caller which then
	// compares this trace to a hard-coded model trace
	printTrace: function() {
		console.log("Stack trace of recursiveLog")
		_.map(history, function(line) {
			console.log(line)
		})
	},

	// Get trace as array
	getTrace: function() {
		return history;
	}


}