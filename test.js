var Promise = require('bluebird');

var Participant = require('./Participant');
var MoveRound   = require('./MoveRound');
var Transition  = require('./Transition');
var Runner      = require('./Runner');
var Game        = require('./Game'); 

var recursiveLog = require('./utils/recursiveLog');

var players = [new Participant('A', {}), new Participant('B', {}), new Participant('C', {})];

/*

// MOVEROUND

var mr = new MoveRound({timeout: 3500, loop: true})

mr._initialize({
	allPlayers: players,
	playersRemaining: players,
	counter: 0
})

mr._start()
.then(function() {
	console.log("Move Round ended");
})

// TRANSITION

var tr = new Transition({delay: 4500, loop: true})

tr._initialize({
	allPlayers: players
});

tr._start()
.then(function() {
	console.log("Transition completed");
})
*/

/*
// RUNNER

var runner = new Runner({loop: false});

runner._initialize({
	allPlayers: players
}, [
	new MoveRound({timeout: 3500, loop: false}),
	new Transition({delay: 1500, loop: false}),
	new MoveRound({timeout: 3500, loop: false}),
	new Transition({delay: 5500, loop: false})
]);

runner._start()
.then(function() {
	console.log("RUNNER FINISHED");
})

*/
/*
var game = new Game(players, {counter: 0}, [

	new Runner({name: 'upper_level', loop: true}, [

		//new Transition({name: 'start_transition', delay: 500, loop: false}),

		new Runner({name: 'run1', loop: false}, [
			new Runner({name: 'run1_sub', loop: false}, [
				new Transition({name: 'run1sub_1', delay: 1500, loop: false}),
				new MoveRound({timeout: 3500, loop: false}),
				new Transition({name: 'run1sub_2', delay: 1500, loop: false}),
				new MoveRound({timeout: 3500, loop: false}),
			]),
		]),

		new Runner({name: 'run2', loop: false}, [
			new MoveRound({timeout: 3500, loop: false}),

		])
	])
])
*/

var game = new Game([
	new MoveRound({timeout: 3500, loop: true}),
])

var b = new Participant('B', {});

Promise.try(function() {
	return game.register([new Participant('A', {}), b])
})
.delay(1000)
.then(function() {
	return game.register([new Participant('C', {}), b, new Participant('D', {})])
})
.delay(500)
.then(function() {
	//return game.cancelGame();
	return game.start({counter: 0})
})
.delay(800)
.then(function(results) {
	console.log("Game ended");
	console.log(results)
	recursiveLog.printTrace();
})



/*

IDEAL:

var game = new Game(players, settings, phase);
game.start()
.then(function(gameResults) {
	
})
.catch(Error1, function() {})
.catch(Error2, function() {})

*/