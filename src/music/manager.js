const { GuildMusicPlayer } = require("./guild-player");

const players = new Map();

function getPlayer(guild) {
  const existing = players.get(guild.id);
  if (existing) return existing;

  const player = new GuildMusicPlayer(guild);
  players.set(guild.id, player);
  return player;
}

function deletePlayer(guildId) {
  players.delete(guildId);
}

module.exports = { getPlayer, deletePlayer };
