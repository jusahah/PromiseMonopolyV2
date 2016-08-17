var _ = require('lodash');

var RetryTurn = require('../actions/RetryTurn')
var SkipMove  = require('../actions/SkipMove');
var EndMoveRound = require('../actions/EndMoveRound');
var EndGame = require('../actions/EndGame');
var NoMoreMovesFromThisParticipant = require('../actions/NoMoreMovesFromThisParticipant');

// Refactor - should be included into MoveRound prototype, not to MoveRound itself.
function ActionsIncluded(moveRound) {

	this.actions = {
		/** 
		* Skips player move without removing her from the moveRound's player list.
		* Callable from: beforeMove
		*/		
		skipMove: function() {
			throw new SkipMove();
		},
		/** 
		* Gives turn back to the previous player, thus allowing same player
		* to make multiple moves in a row.
		* Callable from: afterMove, handleIllegalMove, handleLegalMove, handleTimeout
		*/
		retryTurn: function() {
			throw new RetryTurn();
		},
		/**
		* Removes player from moveRound's player list so that she won't be
		* asked to make a move again.
		* Note that player is not removed from the Game, and will be given
		* move when next moveRound is started.
		* Callable from: afterMove, handleIllegalMove, handleLegalMove, handleTimeout
		*/
		noMoreMovesFromThisParticipant: function() {
			throw new NoMoreMovesFromThisParticipant();
		},
		/**
		* Ends move round, allowing control to return back to original caller in the chain
		* Callable from: everywhere
		*/
		endMoveRound: function() {
			throw new EndMoveRound();
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
			_.map(moveRound.state.allPlayers, function(p) {
				p.msg(msg);
			})
		}
	}
}

module.exports = ActionsIncluded;