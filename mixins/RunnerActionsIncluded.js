var _ = require('lodash');

var EndGame = require('../actions/EndGame');

// Refactor - should be included into MoveRound prototype, not to MoveRound itself.
function RunnerActionsIncluded(transition) {

	this.actions = {
		/**
		* Ends the Game. Control propagates forcibly all the way up where Game is ended.
		* Callable from: everywhere
		*/
		endGame: function() {
			throw new EndGame();
		},
		/**
		* Custom broadcast to all players of the Game
		* Callable from: everywhere 
		*/
		broadcast: function(msg) {
			_.map(transition.state.allPlayers, function(p) {
				p.msg(msg);
			})
		}
	}
}

module.exports = RunnerActionsIncluded;