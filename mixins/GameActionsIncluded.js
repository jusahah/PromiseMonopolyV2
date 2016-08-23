var _ = require('lodash');

var EndGame = require('../actions/EndGame');
var RejectRegistration = require('../actions/RejectRegistration');
var AcceptAndStartGame = require('../actions/AcceptAndStartGame');

// Refactor - should be included into MoveRound prototype, not to MoveRound itself.
function GameActionsIncluded(transition) {

	this.actions = {
		/**
		* Ends the Game. Control propagates forcibly all the way up where Game is ended.
		* Callable from: everywhere
		*/
		endGame: function() {
			throw new EndGame();
		},

		/**
		* Reject a registration of participant.
		* Callable from: Game
		*/
		rejectRegistration: function() {
			throw new RejectRegistration();
		},

		/**
		* Accept registration of participant and start game.
		* Callable from: Game
		*/
		acceptAndStartGame: function() {
			throw new AcceptAndStartGame();
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

module.exports = GameActionsIncluded;