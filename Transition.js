var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

var recursiveLog = require('./utils/recursiveLog');

/** Domain exceptions */

/** Domains actions */ 
var EndGame = require('./actions/EndGame')
var EndTransition = require('./actions/EndTransition')

/** Mixins of MoveRound */
var TransitionActionsIncluded = require('./mixins/TransitionActionsIncluded');


function Transition(settings) {

	TransitionActionsIncluded.call(this, this);
	/** Settings for the transition, not meant to be accessed by callbacks */
	this._settings = {
		name: settings.name || "(none)",
		delay: settings.delay || 5000,
		loop: settings.loop || false
	}
	/** 
	* State pointer that can be accessed from callbacks and handlers
	*/
	this.state = null;
}

Transition.prototype.getName = function() {
	return this._settings.name;
}

/**
* Initialize transition with parent state
*
* @param {Object} enclosingState
* @returns void
*/
Transition.prototype._initialize = function(enclosingState) {
	this.state = enclosingState;
}

/**
* Start a transition
*
* @returns Promise
* @throws EndGame
*/
Transition.prototype._start = function() {

	// Run onEnter callback
	this.onEnter();
	
	return this._oneTransitionRound()
	// Run onExit callback
	.finally(this._exit.bind(this));

}

Transition.prototype._oneTransitionRound = function() {
	return Promise.try(function() {
		// Run onStart callback
		return this.onStart();
	}.bind(this))
	.delay(this._settings.delay)
	.then(function() {
		// Recurse if loop set true
		if (this._settings.loop) return this._oneTransitionRound();
	}.bind(this))
	
	
}

/**
* Calls user-specified exit-callback
*
* @returns mixed
* @throws EndGame
*/
Transition.prototype._exit = function() {
	// Run onExit callback
	return this.onExit();
}

Transition.prototype.onEnter = function() {
	recursiveLog.log("TRANSITION " + this._settings.name + ": onEnter ")
	recursiveLog.push();
	console.log(chalk.bgWhite.green("TRANSITION " + this._settings.name + ": onEnter cb"));
	this.actions.setTimesToPlayersClocks(10000);
	this.actions.broadcast({topic: 'transition', msg: 'Transiting to new app state'});
}

Transition.prototype.onStart = function() {
	console.log(chalk.cyan("TRANSITION: onStart cb"));
	this.actions.broadcast({topic: 'transition', msg: 'Playing transition'});
}

Transition.prototype.onExit = function() {
	recursiveLog.pop();
	recursiveLog.log("TRANSITION " + this._settings.name + ": onExit ")
	console.log(chalk.bgWhite.red("TRANSITION " + this._settings.name + ": onExit cb"));

	// Test whether ending game from Transition succeeds
	if (this.state.counter > 16) this.actions.endGame();
}


module.exports = Transition;
