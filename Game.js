var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

/** Domain exceptions */

/** Domains actions */ 
var EndGame = require('./actions/EndGame')

/** Mixins of Game */
var GameActionsIncluded = require('./mixins/GameActionsIncluded');


function Game(players, initialWorld, phases) {
	// Which actions are available to call from Runner callbacks
	GameActionsIncluded.call(this, this);
	/** Settings for the transition, not meant to be accessed by callbacks */

	/** 
	* State pointer that can be accessed from callbacks and handlers
	*/
	this.state = {};
	// Set initial state
	_.assign(this.state, initialWorld, {allPlayers: players})

	/**
	* Phases of the Game
	*/
	this._phases = phases;


}

Game.prototype.getName = function() {
	return 'Game';
}

/**
* Start a game
*
* @returns Promise
*/
Game.prototype._start = function() {

	// Run onEnter callback
	this.onEnter();
	
	return this._runPhases()
	.catch(EndGame, function() {
		console.log("END GAME CAUGHT")
	})
	// Run onExit callback
	.finally(this._exit.bind(this));

}

Game.prototype._runPhases = function() {
	return Promise.try(function() {
		// Run onStart callback
		return this.onStart();
	}.bind(this))
	.return(this._phases)
	.mapSeries(this._runPhase.bind(this));
		
}

Game.prototype._runPhase = function(phase) {
	return Promise.try(function() {
		this.onPhaseStart(phase.getName());
		phase._initialize(this.state);
		return phase._start();
	}.bind(this))
	.finally(this.onPhaseEnd.bind(this, phase.getName()));
}

/**
* Calls user-specified exit-callback
*
* @returns mixed
*/
Game.prototype._exit = function() {
	// Run onExit callback
	return this.onExit();
}

Game.prototype.onPhaseStart = function(phaseName) {
	console.log(chalk.magenta("GAME: onPhaseStart cb for " + phaseName));
}

Game.prototype.onPhaseEnd= function(phaseName) {
	//this.actions.endGame();
	console.log(chalk.magenta("GAME: onPhaseEnd cb for " + phaseName));
}

Game.prototype.onEnter = function() {
	console.log(chalk.bgBlack("----------------"));
	console.log(chalk.bgBlack.green("GAME: onEnter cb"));
	console.log(chalk.bgBlack("----------------"));

	this.actions.broadcast({topic: 'runner', msg: 'Entering game'});
}

Game.prototype.onStart = function() {
	console.log(chalk.magenta("GAME: onStart cb"));
	this.actions.broadcast({topic: 'runner', msg: 'Starting game'});
}

Game.prototype.onExit = function() {
	console.log(chalk.bgBlack("----------------"));
	console.log(chalk.bgBlack.red("GAME: onExit cb"));
	console.log(chalk.bgBlack("----------------"));

}


module.exports = Game;
