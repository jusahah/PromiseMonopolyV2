var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

/** Domain errors */
var EndGame = require('./exceptions/EndGame')
var EndMoveRound = require('./exceptions/EndMoveRound')
var IllegalMove = require('./exceptions/IllegalMove')

/** Domains actions */ 
var RetryTurn = require('./actions/RetryTurn')

/** Mixins of MoveRound */
var ActionsIncluded = require('./mixins/ActionsIncluded');



function MoveRound(settings) {
	// Decorate with this.actions set to Actions object
	ActionsIncluded.call(null, this);

	this._settings = {
		timeout: settings.timeout || 5000,
		loop: settings.loop || false
	}

	this._playersForTheRound;


}

/*
* Start a move round
*
* @returns Promise
* @throws EndGame
*/
MoveRound.prototype._start = function() {
	// Run onEnter
	this.onEnter();
	// Run player selection handler
	this._playersForTheRound = this.selectPlayersForMoveRound();
	// Run onStart callback
	this.onStart();

	return this._roundOfMoves()
	// One round of moves completed, check if loop-condition is true
	.then(function() {
		// If loop is on, we recurse back for another round of moves
		if (this._settings.loop) return this._roundOfMoves();
		// We explicitly throw EndMoveRound so we end up in the handler
		throw new EndMoveRound();
	}.bind(this))
	// We trap EndMoveRound errors here so we can call exit-handler correctly.
	.catch(EndMoveRound, function() {
		console.log(chalk.red("Action: EndMoveRound"));
	})
	.finally(this._exit.bind(this));

	
}

/*
* Begings a round of moves where each remaining player 
* is asked at least once to make her move.
*
* @returns Promise
* @throws EndMoveRound
* @throws EndGame
*/
MoveRound.prototype._roundOfMoves = function() {
	// Run onEnter callback
	this.onRoundOfMoves();
	// Make a copy of remaining player because we modify original during promise chain
	var copyOfPlayers = _.slice(this._playersForTheRound);
	// Start the chain
	return Promise.mapSeries(copyOfPlayers, this._askPlayerForMove.bind(this))
}
/*
* Asks Player to make his move.
*
* @returns Promise
* @throws EndMoveRound
* @throws EndGame
*/
MoveRound.prototype._askPlayerForMove = function(player) {
	// Run beforeMove callback
	this.beforeMove(player);
	// Ask player for move and start the promise chain
	return player.makeMove().timeout(this._settings.timeout)
	// Check if legal move -> throws 'IllegalMove' if not
	.tap(this.checkMoveLegality.bind(this))
	// Was legal, mutate state based on move
	.then(this.handleLegalMove.bind(this))
	// Errors
	// If player was too slow, we get thrown at us TimeoutError
	.catch(Promise.TimeoutError, this.handleTimeout.bind(this))
	// If player made illegal move, we get thrown at us IllegalMove
	.catch(IllegalMove, this.handleIllegalMove.bind(this)) // Throws 'RetryTurn'
	// Player does not continue making moves in case the MoveRound recurses.
	.catch(NoMoreMovesFromThisPlayer, function() {
		// Remove player from remaining players array
		_.remove(this._playersForTheRound, function(p) {
			return p === player;
		});
	}.bind(this))
	// Catch RetryTurn if it was thrown somewhere
	.catch(RetryTurn, function() {
		// Recurse back
		// Run onRetryTurn callback
		this.onRetryTurn();
		return this._askPlayerForMove(player);
	}.bind(this))
	// Make sure afterMove callback is always run
	.finally(this.afterMove.bind(this))

}

/*
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
MoveRound.prototype.selectPlayersForMoveRound = function() {
	console.log(chalk.green("selectPlayersForMoveRound cb"))

}

// Handlers
MoveRound.prototype.handleTimeout = function() {
	return false;
}

MoveRound.prototype.handleIllegalMove = function() {
	this.actions.retryTurn();
}

MoveRound.prototype.handleLegalMove = function() {
	// Mutate global state based on move
	// If dont want to include player to a next recursion of MoveRound,
	// throw "NoMoreMovesFromThisPlayer"

	this.actions.noMoreMovesFromThisPlayer();
}

MoveRound.prototype.afterMove = function() {
	console.log(chalk.cyan("afterMove cb"))
}

MoveRound.prototype.beforeMove = function() {
	console.log(chalk.cyan("beforeMove cb"))
}