const {
  ActivityType,
  ActionRowBuilder,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { AudioPlayerStatus } = require("@discordjs/voice");
const { token } = require("./config");
const { getPlayer, deletePlayer } = require("./music/manager");
const { resolveTracks } = require("./music/youtube");
const { truncate } = require("./music/format");
const { loopLabel, playerControlRows } = require("./music/guild-player");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.once(Events.ClientReady, () => {
  console.log(`Logado como ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: "/play", type: ActivityType.Listening }],
    status: "online",
  });
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }
  } catch (error) {
    console.error("Erro ao responder interacao:", error);
    await safeReply(
      interaction,
      "Deu erro ao executar isso. Ve o terminal para detalhes."
    );
  }
});

async function handleCommand(interaction) {
  const player = getPlayer(interaction.guild);

  switch (interaction.commandName) {
    case "play": {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        await interaction.reply({
          content: "Entra em um canal de voz primeiro.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();
      const query = interaction.options.getString("busca", true);
      const tracks = await resolveTracks(query, interaction.user.tag);

      if (!tracks.length) {
        await interaction.editReply("Nao achei nada no YouTube com essa busca.");
        return;
      }

      await player.addTracks(tracks, voiceChannel, interaction.channel);

      const first = tracks[0];
      const message =
        tracks.length === 1
          ? `Adicionado: **${truncate(first.title, 120)}**`
          : `Playlist adicionada com **${tracks.length}** musicas. Primeira: **${truncate(first.title, 100)}**`;

      await interaction.editReply(message);
      return;
    }

    case "pause":
      await interaction.reply(player.pause() ? "Pausado." : "Nao consegui pausar agora.");
      return;

    case "resume":
      await interaction.reply(player.resume() ? "Continuando." : "Nao tem nada pausado.");
      return;

    case "skip":
      player.skip();
      await interaction.reply("Pulando para a proxima.");
      return;

    case "stop":
      player.stop();
      deletePlayer(interaction.guildId);
      await interaction.reply("Player parado, fila limpa e sai do canal.");
      return;

    case "queue":
      await interaction.reply({ embeds: [player.queueEmbed()] });
      return;

    case "nowplaying":
      await interaction.reply({
        embeds: [player.nowPlayingEmbed()],
        components: playerControlRows(),
      });
      return;

    case "controls":
      await interaction.reply({
        embeds: [player.nowPlayingEmbed()],
        components: playerControlRows(),
      });
      return;

    case "volume": {
      const value = interaction.options.getInteger("valor", true);
      player.setVolume(value);
      await interaction.reply(`Volume definido para **${value}%**.`);
      return;
    }

    case "loop": {
      const mode = interaction.options.getString("modo", true);
      player.setLoop(mode);
      await interaction.reply(`Loop configurado para **${mode}**.`);
      return;
    }

    case "shuffle":
      player.shuffle();
      await interaction.reply("Fila embaralhada.");
      return;

    case "remove": {
      const position = interaction.options.getInteger("posicao", true);
      const removed = player.remove(position);
      await interaction.reply(
        removed
          ? `Removido: **${truncate(removed.title, 120)}**`
          : "Essa posicao nao existe na fila."
      );
      return;
    }

    case "move": {
      const from = interaction.options.getInteger("de", true);
      const to = interaction.options.getInteger("para", true);
      const moved = player.move(from, to);
      await interaction.reply(
        moved
          ? `Movido: **${truncate(moved.title, 120)}** para a posicao **${to}**.`
          : "Nao consegui mover. Confere as posicoes da fila."
      );
      return;
    }

    case "clear": {
      const removed = player.clear();
      await interaction.reply(`Limpei **${removed}** musica(s) da fila.`);
      return;
    }

    case "join": {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) {
        await interaction.reply({
          content: "Entra em um canal de voz primeiro.",
          ephemeral: true,
        });
        return;
      }

      await player.connect(voiceChannel, interaction.channel);
      await interaction.reply(`Entrei em **${voiceChannel.name}**.`);
      return;
    }

    case "leave":
      player.stop();
      deletePlayer(interaction.guildId);
      await interaction.reply("Sai do canal de voz.");
      return;

    case "help":
      await interaction.reply({ embeds: [helpEmbed()] });
      return;

    default:
      await interaction.reply({
        content: "Comando desconhecido.",
        ephemeral: true,
      });
  }
}

async function handleButton(interaction) {
  const player = getPlayer(interaction.guild);
  const action = interaction.customId.replace("music:", "");

  if (action === "add") {
    await interaction.showModal(addMusicModal());
    return;
  }

  if (!interaction.member.voice.channel) {
    await interaction.reply({
      content: "Entra no canal de voz para controlar o player.",
      ephemeral: true,
    });
    return;
  }

  if (action === "pause") {
    player.pause();
    await refreshControlPanel(interaction, player, "Pausado.");
    return;
  }

  if (action === "resume") {
    player.resume();
    await refreshControlPanel(interaction, player, "Continuando.");
    return;
  }

  if (action === "skip") {
    player.skip();
    await refreshControlPanel(interaction, player, "Pulando.");
    return;
  }

  if (action === "stop") {
    player.stop();
    deletePlayer(interaction.guildId);
    await refreshControlPanel(interaction, player, "Player parado.");
    return;
  }

  if (action === "volume_down") {
    player.setVolume(Math.max(0, player.volume - 10));
    await refreshControlPanel(interaction, player, `Volume: ${player.volume}%.`);
    return;
  }

  if (action === "volume_up") {
    player.setVolume(Math.min(200, player.volume + 10));
    await refreshControlPanel(interaction, player, `Volume: ${player.volume}%.`);
    return;
  }

  if (action === "loop") {
    const mode = player.cycleLoop();
    await refreshControlPanel(interaction, player, `Loop: ${loopLabel(mode)}.`);
    return;
  }

  if (action === "shuffle") {
    player.shuffle();
    await refreshControlPanel(interaction, player, "Fila embaralhada.");
    return;
  }

  if (action === "queue") {
    await interaction.reply({
      embeds: [player.queueEmbed()],
      ephemeral: true,
    });
  }
}

async function handleModal(interaction) {
  if (interaction.customId !== "music:add_modal") return;

  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    await interaction.reply({
      content: "Entra em um canal de voz primeiro.",
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const query = interaction.fields.getTextInputValue("query");
  const tracks = await resolveTracks(query, interaction.user.tag);

  if (!tracks.length) {
    await interaction.editReply("Nao achei nada no YouTube com essa busca.");
    return;
  }

  const player = getPlayer(interaction.guild);
  await player.addTracks(tracks, voiceChannel, interaction.channel);

  const first = tracks[0];
  const message =
    tracks.length === 1
      ? `Adicionado pelo painel: **${truncate(first.title, 120)}**`
      : `Playlist adicionada pelo painel com **${tracks.length}** musicas. Primeira: **${truncate(first.title, 100)}**`;

  await interaction.editReply(message);
}

function addMusicModal() {
  const queryInput = new TextInputBuilder()
    .setCustomId("query")
    .setLabel("Link ou busca do YouTube")
    .setPlaceholder("Ex: Michael Jackson Billie Jean")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId("music:add_modal")
    .setTitle("Adicionar musica")
    .addComponents(new ActionRowBuilder().addComponents(queryInput));
}

async function refreshControlPanel(interaction, player, message) {
  await interaction.update({
    embeds: [player.nowPlayingEmbed()],
    components: playerControlRows(),
  });

  if (message) {
    await interaction
      .followUp({ content: message, ephemeral: true })
      .catch(() => {});
  }
}

function helpEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Comandos do bot de musica")
    .setDescription(
      [
        "`/play busca:` toca link, busca ou playlist do YouTube",
        "`/pause`, `/resume`, `/skip`, `/stop`",
        "`/queue`, `/nowplaying`, `/controls`, `/clear`",
        "`/volume valor`, `/loop modo`, `/shuffle`",
        "`/remove posicao`, `/move de para`",
        "`/join`, `/leave`",
      ].join("\n")
    );
}

async function safeReply(interaction, content) {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(content).catch(() => {});
    return;
  }

  await interaction.reply({ content, ephemeral: true }).catch(() => {});
}

client.on("voiceStateUpdate", (_, newState) => {
  if (!newState.guild.members.me?.voice.channel) return;

  const botChannel = newState.guild.members.me.voice.channel;
  const humans = botChannel.members.filter((member) => !member.user.bot);

  if (humans.size === 0) {
    const player = getPlayer(newState.guild);
    if (player.player.state.status !== AudioPlayerStatus.Idle) {
      player.stop();
      deletePlayer(newState.guild.id);
    }
  }
});

client.login(token);
