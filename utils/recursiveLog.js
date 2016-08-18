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
		history.push(_.repeat('-', currLevel) + chalk.white.bgBlue(msg));
	},
	log2: function(msg) {
		console.log(_.repeat('-', currLevel) + chalk.white.bgYellow(msg));
	},

	printTrace: function() {
		console.log("Stack trace of recursiveLog")
		_.map(history, function(line) {
			console.log(line)
		})
	}


}