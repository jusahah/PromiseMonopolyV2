var Participant = require('./Participant');
var MoveRound   = require('./MoveRound');

var mr = new MoveRound({})

mr._initialize({
	playersRemaining: [new Participant('A', {}, new Participant('B', {}))],
	counter: 0
})

mr._start()
.then(function() {
	console.log("Move Round ended");
})