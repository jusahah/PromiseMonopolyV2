var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

/** Domain exceptions */

/** Domains actions */ 
var EndGame = require('./actions/EndGame')

/** Mixins of Game */
var GameActionsIncluded = require('./mixins/GameActionsIncluded');


function Game(phases) {
	// Which actions are available to call from Runner callbacks
	GameActionsIncluded.call(this, this);
	/** Settings for the transition, not meant to be accessed by callbacks */

	/** 
	* State pointer that can be accessed from callbacks and handlers
	*/
	this.state = {};
	// Set initial state

	this._startingPlayers = [];

	/**
	* Is registration open or closed
	*
	*/
	this.gameHasStarted = false;
	

	/**
	* Phases of the Game
	*/
	this._phases = phases;


}

Game.prototype.getPlayers = function() {
	return _.slice(this._startingPlayers);
}

Game.prototype.getInfo = function() {
	return {
		name: 'game_info_test',
		players: _.map(this._startingPlayers, function(p) {return p.getUserName()});
	}
}

Game.prototype.makePublicBroadcast = function(msg) {
	_.each(this._startingPlayers, function(player) {
		player.msg(msg);
	})
}

Game.prototype.getName = function() {
	return 'Game';
}

Game.prototype.start = function(initialWorld) {
	_.assign(this.state, initialWorld);
	return this._start();
}

Game.prototype.cancelGame = function() {
	// Inform all players
	_.each(this._startingPlayers, function(player) {
		player.gameCancelled(this);
	}.bind(this));
	// Empty players array
	this._startingPlayers = [];

}

Game.prototype.registerPlayer = function(player) {
	if (player.registerToGame(this)) {
		// Player is available for registering
		this.onRegistration(player);
		this._startingPlayers.push(player);
	} 
}

Game.prototype.register = function(players) {
	if (!this.gameHasStarted) {
		console.log("Registering players: " + players.length);
		_.each(players, this.registerPlayer.bind(this));
	}
	return this;
}

/**
* Start a game
*
* @returns Promise
*/
Game.prototype._start = function() {

	if (this.gameHasStarted) {
		throw new Error('Game already started');
	}

	this.gameHasStarted = true;

	// Add players to a state object
	this.state.allPlayers = this._startingPlayers;

	// Run onEnter callback
	this.onEnter();
	
	return this._runPhases()
	// This catch is always run! There is no way to sidestep it.
	.catch(EndGame, function() {
		console.log("END GAME CAUGHT")
		return this._exit();
	}.bind(this))

}

Game.prototype._runPhases = function() {
	return Promise.try(function() {
		// Run onStart callback
		return this.onStart();
	}.bind(this))
	.return(this._phases)
	.mapSeries(this._runPhase.bind(this))
	// Make sure we always throw EndGame from here up
	.throw(new EndGame())
		
}

Game.prototype._runPhase = function(phase) {
	return Promise.try(function() {
		this.onPhaseStart(phase.getName());
		phase._initialize(this.state);
		return phase._start();
	}.bind(this))
	.finally(this.onPhaseEnd.bind(this, phase.getName()));
}

Game.prototype.onRegistration = function(player) {
	// Throws: 'RejectRegistration', 'AcceptAndStartGame'
	console.log(chalk.magenta("GAME: onRegistration cb"));
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
	// Return value from here will be passed into caller as 'results' variable!
	return this.state.counter;

}


module.exports = Game;
