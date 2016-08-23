var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');

var Game = require('./Game');

// Domain errors
var GameAlreadyStarted = require('./exceptions/GameAlreadyStarted');
// Domain exception to be caught here
var RejectRegistration = require('./actions/RejectRegistration');
var AcceptAndStartGame = require('./actions/AcceptAndStartGame');


function Lobby() {
	// Players currently present in lobby
	this.inLobby = [];
	// Games currently running
	this.games   = [];

	this.addGame = function(game) {
		this.games.push(game)
	}

	this.registerPlayerToGame = function(player, game) {
		if (_.indexOf(this.games, game) === -1) throw new Error("Game not found in Lobby");
		try {
			game.register([player]);
			this.playerLeavesLobby(player);
		} catch (e) {
			if (e instanceof AcceptAndStartGame) {
				this.playerLeavesLobby(player);
				this.startGame(game);
			}

			else if (e instanceof RejectRegistration) {
				// Player remains in the lobby
				player.msg({
					topic: 'registration_rejected',
					game: game.id
				});
			}
			else if (e instanceof GameAlreadyStarted) {
				player.msg({
					topic: 'registration_rejected',
					game: game.id
				});				
			}
		}
	}

	this.startGame = function(game, initialWorld) {
		var prom = game.start(initialWorld);
		this._broadcastLobbyPresence();
		return prom;
	}

	this.playerJoinsLobby = function(player) {

		if (_.indexOf(this.inLobby, player) === -1) {
			this.inLobby.push(player);
			this._broadcastLobbyPresence();
		}


	}
	this.playerLeavesLobby = function(player) {
		var removed = _.remove(this.inLobby, function(p) { return p === player});
		if (removed.length > 0) this._broadcastLobbyPresence();
	}
	this.playerJoinsGame = function(player) {
		_.remove(this.inLobby, function(p) { return p === player});
		// Player is automatically added to Game object by someone else
		this._broadcastLobbyPresence();

	}
	this.gameEnds = function(game) {
		_.remove(this.games, function(g) { return g === game});
		var players = game.getPlayers();

		// Ensure no duplicates accidentally by using 'uniq'
		this.inLobby = _.uniq(_.concat(this.inLobby, players));
		
		this._broadcastLobbyPresence();
	}

	this._broadcastLobbyPresence = function() {
		var usernames = _.map(this.inLobby, function(player) {
			return player.getUserName();
		});

		var ongoingGames = _.map(this.games, function(game) {
			return game.getInfo();
		})

		this.broadcastToLobby({
			topic: 'lobbyUpdate',
			players: usernames,
			games: ongoingGames,
			msg: JSON.stringify(usernames)
		});
	} 

	this.broadcastToLobby = function(msg) {

		_.each(this.inLobby, function(player) {
			player.msg(msg);
		})
	}

	this.broadcastToAll = function(msg) {
		this.broadcastToLobby(msg);

		_.each(this.games, function(game) {
			game.makePublicBroadcast(msg);
		});
	} 


}

module.exports = Lobby;