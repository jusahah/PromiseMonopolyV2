var RetryTurn = require('../actions/RetryTurn')
var EndMoveRound = require('../actions/EndMoveRound');
var EndGame = require('../actions/EndGame');
var NoMoreMovesFromThisParticipant = require('../actions/NoMoreMovesFromThisParticipant');

// Refactor - should be included into MoveRound prototype, not to MoveRound itself.
function ActionsIncluded() {

	this.actions = {

		retryTurn: function() {
			throw new RetryTurn();
		},

		noMoreMovesFromThisParticipant: function() {
			throw new NoMoreMovesFromThisParticipant();
		},

		endMoveRound: function() {
			throw new EndMoveRound();
		},

		endGame: function() {
			throw new EndGame();
		},
	}
}

module.exports = ActionsIncluded;