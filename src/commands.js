const { SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Toca uma musica do YouTube por link ou busca.")
    .addStringOption((option) =>
      option
        .setName("busca")
        .setDescription("Link ou nome da musica")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pausa a musica atual."),
  new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Continua a musica pausada."),
  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Pula para a proxima musica."),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Para tudo, limpa a fila e sai do canal de voz."),
  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Mostra a fila de musicas."),
  new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Mostra a musica tocando agora."),
  new SlashCommandBuilder()
    .setName("controls")
    .setDescription("Abre um painel de controle no chat atual, inclusive no chat do canal de voz."),
  new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Define o volume do player.")
    .addIntegerOption((option) =>
      option
        .setName("valor")
        .setDescription("Volume de 0 a 200")
        .setMinValue(0)
        .setMaxValue(200)
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Configura repeticao.")
    .addStringOption((option) =>
      option
        .setName("modo")
        .setDescription("Modo de repeticao")
        .setRequired(true)
        .addChoices(
          { name: "Desligado", value: "off" },
          { name: "Musica atual", value: "track" },
          { name: "Fila inteira", value: "queue" }
        )
    ),
  new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Embaralha a fila."),
  new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove uma musica da fila.")
    .addIntegerOption((option) =>
      option
        .setName("posicao")
        .setDescription("Numero da musica na fila")
        .setMinValue(1)
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("move")
    .setDescription("Move uma musica para outra posicao na fila.")
    .addIntegerOption((option) =>
      option
        .setName("de")
        .setDescription("Posicao atual")
        .setMinValue(1)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("para")
        .setDescription("Nova posicao")
        .setMinValue(1)
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Limpa a fila, mantendo a musica atual."),
  new SlashCommandBuilder()
    .setName("join")
    .setDescription("Faz o bot entrar no seu canal de voz."),
  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Faz o bot sair do canal de voz."),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Mostra todos os comandos do bot."),
].map((command) => command.toJSON());

module.exports = { commands };
