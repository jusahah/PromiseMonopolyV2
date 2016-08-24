var _ = require('lodash');

var EndTransition = require('../actions/EndTransition');
var EndGame = require('../actions/EndGame');

// Refactor - should be included into MoveRound prototype, not to MoveRound itself.
function TransitionActionsIncluded(transition) {

	this.actions = {

		setTimesToPlayersClocks: function(newTime) {
			console.log("RESETTING PLAYER CLOCKS TO: " + newTime);
			_.each(transition.state.allPlayers, function(player) {
				player.setGameTime(newTime);
			});
		},
		/**
		* Ends move round, allowing control to return back to original caller in the chain
		* Callable from: everywhere
		*/
		endTransition: function() {
			throw new EndTransition();
		},
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

module.exports = TransitionActionsIncluded;