var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

var recursiveLog = require('./utils/recursiveLog');

/** Domain exceptions */
var IllegalMove = require('./exceptions/IllegalMove')
var AlreadyDisconnected = require('./exceptions/AlreadyDisconnected')
var PlayerFlagged = require('./exceptions/PlayerFlagged');

/** Domains actions */ 
var EndGame = require('./actions/EndGame')
var EndMoveRound = require('./actions/EndMoveRound')
var RetryTurn = require('./actions/RetryTurn')
var SkipMove  = require('./actions/SkipMove');
var NoMoreMovesFromThisParticipant = require('./actions/NoMoreMovesFromThisParticipant');

/** Mixins of MoveRound */
var ActionsIncluded = require('./mixins/ActionsIncluded');


function MoveRound(settings) {
	// Decorate with this.actions set to Actions object
	ActionsIncluded.call(this, this);
	/** Settings for the move round, not meant to be accessed by callbacks */
	this._settings = {
		timeout: settings.timeout || 5000,
		loop: settings.loop || false
	}
	/**
	* Participants participating
	* Is set by 'selectParticipantsForMoveRound' initializer callback
	*/
	this._participantsForTheRound = [];

	/** 
	* State pointer that can be accessed from callbacks and handlers
	*/
	this.state = null;


}

MoveRound.prototype.getName = function() {
	return 'moveround';
}


/**
* Initialize move round with parent state
*
* @returns void
*/
MoveRound.prototype._initialize = function(enclosingState) {
	this.state = enclosingState;
}

/**
* Start a move round
*
* @returns Promise
* @throws EndGame
*/
MoveRound.prototype._start = function() {
	// Run onEnter
	this.onEnter();
	// Run Participant selection handler
	this._participantsForTheRound = this.selectParticipantsForMoveRound();
	// Run onStart callback
	this.onStart();

	return this._roundOfMoves()
	// We trap EndMoveRound errors here so we can call exit-handler correctly.
	.catch(EndMoveRound, function(endMoveRound) {
		console.log(chalk.magenta("Action: EndMoveRound"));
	})
	.finally(this._exit.bind(this));

	
}

/**
* Begings a round of moves where each remaining Participant 
* is asked at least once to make her move.
*
* @returns Promise
* @throws EndMoveRound
* @throws EndGame
*/
MoveRound.prototype._roundOfMoves = function() {
	// Run onEnter callback
	this.onRoundOfMoves();
	// Make a copy of remaining Participant because we modify original during promise chain
	var copyOfParticipants = _.slice(this._participantsForTheRound);
	console.log("Round of moves with player count: " + copyOfParticipants.length);
	// Start the chain
	return Promise.mapSeries(copyOfParticipants, this._askParticipantForMove.bind(this))
	// One round of moves completed, check if loop-condition is true
	.then(function() {
		// If no remaining players we must end the move round!
		console.log("Next round? Remaining count: " + this._participantsForTheRound.length);
		if (this._participantsForTheRound.length === 0) this.actions.endMoveRound();
		// If loop is on, we recurse back for another round of moves
		if (this._settings.loop) return this._roundOfMoves();
		// We explicitly throw EndMoveRound so we end up in the handler
		this.actions.endMoveRound();
	}.bind(this))	
}
/**
* Asks Participant to make his move.
*
* @returns Promise
* @throws EndMoveRound
* @throws EndGame
*/
MoveRound.prototype._askParticipantForMove = function(participant) {
	//if (participant.hasDisconnected()) return true; // Bail instantly
	
	// Track player move time
	var moveRequestSent;
	
	// Ask Participant for move and start the promise chain
	return Promise.try(function() {
		// Run beforeMove callback
		return this.beforeMove(participant);
	}.bind(this))
	.then(function() {
		moveRequestSent = Date.now();
		return participant.makeMove().timeout(this._settings.timeout)
	}.bind(this))
	// Check if legal move -> throws 'IllegalMove' if not
	.tap(function() {
		var moveTime = Date.now() - moveRequestSent;
		console.log(chalk.red("MOVETIME WAS: " + moveTime))
		participant.substractTime(moveTime); // Throws 'PlayerFlagged' if player oversteps time.
	})
	.tap(function(move) {

		return Promise.try(function() {
			return this.checkMoveLegality(move);
		}.bind(this))
		.then(function(isLegal) {
			// If not legal, raise 'IllegalMove', somebody will catch it down the drain.
			if (!isLegal) throw new IllegalMove(); 
		}.bind(this))
	}.bind(this))
	// Was legal, mutate state based on move
	.then(this.handleLegalMove.bind(this))
	// Errors
	// If Participant was too slow, we get thrown at us TimeoutError
	.catch(Promise.TimeoutError, function() {
		// Check if player has lost connection
		if (participant.hasDisconnected()) {
			console.log("DISCONNECT CAUGHT");
			_.remove(this._participantsForTheRound, function(p) {
				return p === participant
			});
		}
		return this.handleTimeout();
	}.bind(this))
	// Catch player running out of cumulative clock
	.catch(PlayerFlagged, this.handleFlagFall.bind(this))
	// Move was skipped by user code
	.catch(SkipMove, function() {
		// Do pretty much nothing
	})
	// If Participant made illegal move, we get thrown at us IllegalMove
	.catch(IllegalMove, this.handleIllegalMove.bind(this)) // Throws 'RetryTurn'
	// Participant does not continue making moves in case the MoveRound recurses.
	.catch(NoMoreMovesFromThisParticipant, function() {
		// Remove Participant from remaining Participants array
		_.remove(this._participantsForTheRound, function(p) {
			return p === participant;
		});
	}.bind(this))
	// Catch RetryTurn if it was thrown somewhere
	.catch(RetryTurn, function() {
		// Recurse back
		// Run onRetryTurn callback
		console.log("RETRY TURN CATCH")
		this.onRetryTurn();
		return this._askParticipantForMove(participant);
	}.bind(this))
	// Player has already disconnected
	.catch(AlreadyDisconnected, function() {
		_.remove(this._participantsForTheRound, function(p) {
			return p === participant
		});
	}.bind(this))
	// Make sure afterMove callback is always run
	.finally(this.afterMove.bind(this))

}

/**
* Calls user-specified exit-callback
*
* @returns mixed
* @throws EndGame
*/
MoveRound.prototype._exit = function() {
	// Run onExit callback
	return this.onExit();
}


// To be extented by client

// Listeners
MoveRound.prototype.onEnter = function() {
	recursiveLog.log("MOVEROUND: onEnter ")
	recursiveLog.push();
	console.log(chalk.cyan("onEnter cb"));
}

MoveRound.prototype.onStart = function() {
	console.log(chalk.cyan("onStart cb"));
}

MoveRound.prototype.onRoundOfMoves = function() {
	console.log(chalk.cyan("onRoundOfMoves cb"));
}

MoveRound.prototype.onExit = function() {
	recursiveLog.pop();
	recursiveLog.log("MOVEROUND: onExit")
	console.log(chalk.cyan("onExit cb"));
}

MoveRound.prototype.onRetryTurn = function() {
	console.log(chalk.cyan("onRetryTurn cb"))
}

// Initializers
MoveRound.prototype.selectParticipantsForMoveRound = function() {
	console.log(chalk.green("selectParticipantsForMoveRound cb"))

	return _.slice(this.state.allPlayers);

}

// Handlers
MoveRound.prototype.checkMoveLegality = function(move) {
	// Callable actions: 
	// (none)

	console.log(chalk.blue('checkMoveLegality: ' + move));
	return true;
}

MoveRound.prototype.handleTimeout = function() {
	// Callable actions: 
	// retryTurn, noMoreMovesFromThisParticipant, endMoveRound, endGame, broadcast

	console.log(chalk.blue('handleTimeout'));

}

MoveRound.prototype.handleIllegalMove = function() {
	// Callable actions: 
	// retryTurn, noMoreMovesFromThisParticipant, endMoveRound, endGame, broadcast

	console.log(chalk.blue('handleIllegalMove'));
	this.actions.retryTurn();
}

MoveRound.prototype.handleLegalMove = function() {
	// Callable actions: 
	// retryTurn, noMoreMovesFromThisParticipant, endMoveRound, endGame, broadcast

	// Mutate global state based on move
	// If dont want to include Participant to a next recursion of MoveRound,
	// throw "NoMoreMovesFromThisParticipant"
	this.state.counter++;
	console.log(chalk.blue('handleLegalMove'));
	//this.actions.noMoreMovesFromThisParticipant();
}

MoveRound.prototype.handleFlagFall = function() {
	console.log("HANDLE FLAG FALL");
	this.actions.endGame();
}

MoveRound.prototype.afterMove = function(participant) {
	// Callable actions: 
	// retryTurn, noMoreMovesFromThisParticipant, endMoveRound, endGame, broadcast
	console.log(chalk.cyan("afterMove cb"))
	
	this.actions.broadcast({topic: 'new_world', msg: this.state.counter});
	console.log("Moves been made: " + this.state.counter)
}

MoveRound.prototype.beforeMove = function(participant) {
	// Callable actions: 
	// skipMove, endMoveRound, endGame, broadcast
	console.log(chalk.cyan("beforeMove cb"))

	if (Math.random() < 0.1) {
		console.log("Skipping move!!!!")
		this.actions.skipMove();
	}
}

module.exports = MoveRound;


// NEXT:

// Phases ( which call MoveRounds)
// Game container
// Communicator connected to frontend
// Chess Swiss-tournament implementation
// Thats about it.