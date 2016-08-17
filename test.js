var Participant = require('./Participant');
var MoveRound   = require('./MoveRound');

var mr = new MoveRound({timeout: 2000, loop: true})

var players = [new Participant('A', {}), new Participant('B', {})];

mr._initialize({
	allPlayers: players,
	playersRemaining: players,
	counter: 0
})

mr._start()
.then(function() {
	console.log("Move Round ended");
})