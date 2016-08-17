var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

/** Domain exceptions */
var IllegalMove = require('./exceptions/IllegalMove')

/** Domains actions */ 
var EndGame = require('./actions/EndGame')
var EndMoveRound = require('./actions/EndMoveRound')
var RetryTurn = require('./actions/RetryTurn')
var NoMoreMovesFromThisParticipant = require('./actions/NoMoreMovesFromThisParticipant');

/** Mixins of MoveRound */
var ActionsIncluded = require('./mixins/ActionsIncluded');


function MoveRound(settings) {
	// Decorate with this.actions set to Actions object
	ActionsIncluded.call(this);
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
	// One round of moves completed, check if loop-condition is true
	.then(function() {
		// If loop is on, we recurse back for another round of moves
		if (this._settings.loop) return this._roundOfMoves();
		// We explicitly throw EndMoveRound so we end up in the handler
		this.actions.endMoveRound();
	}.bind(this))
	// We trap EndMoveRound errors here so we can call exit-handler correctly.
	.catch(EndMoveRound, function() {
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
}
/**
* Asks Participant to make his move.
*
* @returns Promise
* @throws EndMoveRound
* @throws EndGame
*/
MoveRound.prototype._askParticipantForMove = function(participant) {
	// Run beforeMove callback
	this.beforeMove(participant);
	// Ask Participant for move and start the promise chain
	return participant.makeMove().timeout(this._settings.timeout)
	// Check if legal move -> throws 'IllegalMove' if not
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
	.catch(Promise.TimeoutError, this.handleTimeout.bind(this))
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
		this.onRetryTurn();
		return this._askParticipantForMove(participant);
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
	console.log(chalk.cyan("onEnter cb"));
}

MoveRound.prototype.onStart = function() {
	console.log(chalk.cyan("onStart cb"));
}

MoveRound.prototype.onRoundOfMoves = function() {
	console.log(chalk.cyan("onRoundOfMoves cb"));
}

MoveRound.prototype.onExit = function() {
	console.log(chalk.cyan("onExit cb"));
}

MoveRound.prototype.onRetryTurn = function() {
	console.log(chalk.cyan("onRetryTurn cb"))
}

// Initializers
MoveRound.prototype.selectParticipantsForMoveRound = function() {
	console.log(chalk.green("selectParticipantsForMoveRound cb"))

	return _.slice(this.state.playersRemaining);

}

// Handlers
MoveRound.prototype.checkMoveLegality = function(move) {
	console.log(chalk.blue('checkMoveLegality: ' + move));
	return true;
}

MoveRound.prototype.handleTimeout = function() {
	console.log(chalk.blue('handleTimeout'));
	return false;
}

MoveRound.prototype.handleIllegalMove = function() {
	console.log(chalk.blue('handleIllegalMove'));
	this.actions.retryTurn();
}

MoveRound.prototype.handleLegalMove = function() {
	// Mutate global state based on move
	// If dont want to include Participant to a next recursion of MoveRound,
	// throw "NoMoreMovesFromThisParticipant"
	console.log(chalk.blue('handleLegalMove'));
	this.actions.noMoreMovesFromThisParticipant();
}

MoveRound.prototype.afterMove = function() {
	console.log(chalk.cyan("afterMove cb"))
	this.state.counter++;
	console.log("Moves been made: " + this.state.counter)
}

MoveRound.prototype.beforeMove = function() {
	console.log(chalk.cyan("beforeMove cb"))
}

module.exports = MoveRound;