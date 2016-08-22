var Promise = require('bluebird');
var _ = require('lodash');
var chalk = require('chalk');


function Lobby() {
	// Players currently present in lobby
	this.inLobby = [];
	// Games currently running
	this.games   = [];

	this.playerJoinsLobby = function(player) {

		if (_.indexOf(this.inLobby, player) === -1) {
			this.inLobby.push(player);
			broadcastLobbyPresence();
		}


	}
	this.playerLeavesLobby = function(player) {
		var removed = _.remove(this.inLobby, function(p) { return p === player});
		if (removed.length > 0) broadcastLobbyPresence();
	}
	this.playerJoinsGame = function(player) {
		_.remove(this.inLobby, function(p) { return p === player});
		// Player is automatically added to Game object by someone else
		broadcastLobbyPresence();

	}
	this.gameEnds = function(game) {
		_.remove(this.games, function(g) { return g === game});
		var players = game.getPlayers();

		// Ensure no duplicates accidentally by using 'uniq'
		this.inLobby = _.uniq(_.concat(this.inLobby, players));
		
		this.broadcastLobbyPresence();
	}

	this.broadcastLobbyPresence = function() {
		var usernames = _.map(this.inLobby, function(player) {
			return player.getUserName();
		});

		var ongoingGames = _.map(this.games, function(game) {
			return game.getInfo();
		})

		broadcastToLobby({
			topic: 'lobbyUpdate',
			players: usernames,
			games: ongoingGames
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