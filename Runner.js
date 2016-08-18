var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

/** Domain exceptions */

/** Domains actions */ 
var EndGame = require('./actions/EndGame')

/** Mixins of MoveRound */
var RunnerActionsIncluded = require('./mixins/RunnerActionsIncluded');


function Runner(settings, phases) {
	// Which actions are available to call from Runner callbacks
	RunnerActionsIncluded.call(this, this);
	/** Settings for the transition, not meant to be accessed by callbacks */
	this._settings = {
		name: settings.name || '(none)',
		loop: settings.loop || false
	}
	/** 
	* State pointer that can be accessed from callbacks and handlers
	*/
	this.state = null;

	this._phases = phases;
}

/**
* Initialize transition with parent state
*
* @param {Object} enclosingState
* @returns void
*/
Runner.prototype._initialize = function(enclosingState, phases) {
	this.state = enclosingState;

	if (phases) this._phases = phases;
}

/**
* Start a transition
*
* @returns Promise
* @throws EndGame
*/
Runner.prototype._start = function() {

	// Run onEnter callback
	this.onEnter();
	
	return this._oneRunnerRound()
	// Run onExit callback
	.finally(this._exit.bind(this));

}

Runner.prototype._oneRunnerRound = function() {
	return Promise.try(function() {
		// Run onStart callback
		return this.onStart();
	}.bind(this))
	.return(this._phases)
	.mapSeries(this._runPhase.bind(this))
	.then(function() {
		// Recurse if loop set true
		if (this._settings.loop) return this._oneRunnerRound();
	}.bind(this))
	
	
}

Runner.prototype._runPhase = function(phase) {
	return Promise.try(function() {
		this.onPhaseStart();
		phase._initialize(this.state);
		return phase._start();
	}.bind(this))
	.finally(this.onPhaseEnd.bind(this));
}

/**
* Calls user-specified exit-callback
*
* @returns mixed
* @throws EndGame
*/
Runner.prototype._exit = function() {
	// Run onExit callback
	return this.onExit();
}

Runner.prototype.onPhaseStart = function() {
	console.log(chalk.magenta("RUNNER: onPhaseStart cb"));
}

Runner.prototype.onPhaseEnd= function() {
	console.log(chalk.magenta("RUNNER: onPhaseEnd cb"));
	//this.actions.endGame();
	
}

Runner.prototype.onEnter = function() {
	console.log(chalk.bgBlack("----------------"));

	console.log(chalk.bgBlack.green("RUNNER " + this._settings.name + ": onEnter cb"));
	console.log(chalk.bgBlack("----------------"));

	this.actions.broadcast({topic: 'runner', msg: 'Entering runner'});
}

Runner.prototype.onStart = function() {
	console.log(chalk.magenta("RUNNER: onStart cb"));
	this.actions.broadcast({topic: 'runner', msg: 'Starting runner'});
}

Runner.prototype.onExit = function() {
	console.log(chalk.bgBlack("----------------"));

	console.log(chalk.bgBlack.red("RUNNER " + this._settings.name + ": onExit cb"));
	console.log(chalk.bgBlack("----------------"));

}


module.exports = Runner;
