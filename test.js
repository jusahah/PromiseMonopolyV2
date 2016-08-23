var Promise = require('bluebird');

var Lobby       = require('./Lobby');
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

var lobby = new Lobby();

var pA = new Participant('A', {});
var pB = new Participant('B', {});
var pC = new Participant('C', {});
var pD = new Participant('D', {});
var pE = new Participant('E', {});
var pF = new Participant('F', {});



var game = new Game([
	new MoveRound({timeout: 3500, loop: true}),
	new Transition({name: 'results', delay: 1000, loop: true})
])

Promise.try(function() {
	lobby.playerJoinsLobby(pA);
})
.delay(300)
.then(function() {
	lobby.playerJoinsLobby(pB);	
}) 
.delay(300)
.then(function() {
	lobby.addGame(game);	
}) 
.delay(300)
.then(function() {
	lobby.playerJoinsLobby(pC);	
}) 
.delay(300)
.then(function() {
	lobby.playerLeavesLobby(pA);	
}) 
.delay(300)
.then(function() {
	lobby.playerJoinsLobby(pE);	
}) 
.delay(300)
.then(function() {
	lobby.playerJoinsLobby(pF);	
}) 
.delay(300)
.then(function() {
	lobby.playerJoinsLobby(pA);	
}) 
.delay(300)
.then(function() {
	lobby.registerPlayerToGame(pA, game);
	//return game.register([pA, pB])
})
.delay(300)
.then(function() {
	lobby.registerPlayerToGame(pB, game);
	//return game.register([pA, pB])
})
.delay(500)
.then(function() {
	return lobby.startGame(game, {counter: 0});
	//return game.cancelGame();
	//return game.start({counter: 0})
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