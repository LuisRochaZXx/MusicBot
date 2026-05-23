const {
  AudioPlayerStatus,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
} = require("@discordjs/voice");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const { createTrackStream } = require("./youtube");
const { formatDuration, truncate } = require("./format");

class GuildMusicPlayer {
  constructor(guild) {
    this.guild = guild;
    this.queue = [];
    this.current = null;
    this.connection = null;
    this.player = createAudioPlayer();
    this.volume = 70;
    this.loopMode = "off";
    this.textChannel = null;
    this.isStopping = false;

    this.player.on(AudioPlayerStatus.Idle, () => {
      if (!this.isStopping) {
        this.playNext().catch((error) => this.reportError(error));
      }
    });

    this.player.on("error", (error) => {
      this.reportError(error);
      this.playNext().catch((nextError) => this.reportError(nextError));
    });
  }

  async connect(voiceChannel, textChannel) {
    this.textChannel = textChannel || this.textChannel;

    const existing = getVoiceConnection(this.guild.id);
    this.connection =
      existing ||
      joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: this.guild.id,
        adapterCreator: this.guild.voiceAdapterCreator,
        selfDeaf: true,
      });

    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });

    await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
    return this.connection;
  }

  async addTracks(tracks, voiceChannel, textChannel) {
    await this.connect(voiceChannel, textChannel);
    this.queue.push(...tracks);

    if (this.player.state.status === AudioPlayerStatus.Idle && !this.current) {
      await this.playNext();
    }
  }

  async playNext() {
    if (this.loopMode === "track" && this.current) {
      this.queue.unshift(this.current);
    } else if (this.loopMode === "queue" && this.current) {
      this.queue.push(this.current);
    }

    const nextTrack = this.queue.shift();
    if (!nextTrack) {
      this.current = null;
      return;
    }

    this.current = nextTrack;
    const stream = await createTrackStream(nextTrack);
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });

    resource.volume?.setVolume(this.volume / 100);
    this.player.play(resource);

    if (this.textChannel) {
      await this.textChannel
        .send({
          embeds: [this.nowPlayingEmbed()],
          components: playerControlRows(),
        })
        .catch(() => {});
    }
  }

  pause() {
    return this.player.pause(true);
  }

  resume() {
    return this.player.unpause();
  }

  skip() {
    this.player.stop(true);
  }

  stop() {
    this.isStopping = true;
    this.queue = [];
    this.current = null;
    this.player.stop(true);
    this.destroy();
    this.isStopping = false;
  }

  destroy() {
    this.connection?.destroy();
    this.connection = null;
  }

  setVolume(value) {
    this.volume = value;
    const resource = this.player.state.resource;
    resource?.volume?.setVolume(value / 100);
  }

  setLoop(mode) {
    this.loopMode = mode;
  }

  cycleLoop() {
    const modes = ["off", "track", "queue"];
    const currentIndex = modes.indexOf(this.loopMode);
    this.loopMode = modes[(currentIndex + 1) % modes.length];
    return this.loopMode;
  }

  clear() {
    const removed = this.queue.length;
    this.queue = [];
    return removed;
  }

  shuffle() {
    for (let index = this.queue.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [this.queue[index], this.queue[swapIndex]] = [
        this.queue[swapIndex],
        this.queue[index],
      ];
    }
  }

  remove(position) {
    if (position < 1 || position > this.queue.length) return null;
    return this.queue.splice(position - 1, 1)[0];
  }

  move(from, to) {
    if (
      from < 1 ||
      from > this.queue.length ||
      to < 1 ||
      to > this.queue.length
    ) {
      return null;
    }

    const [track] = this.queue.splice(from - 1, 1);
    this.queue.splice(to - 1, 0, track);
    return track;
  }

  nowPlayingEmbed() {
    const track = this.current;
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("Tocando agora")
      .setDescription(track ? `[${truncate(track.title, 220)}](${track.url})` : "Nada tocando.")
      .addFields(
        { name: "Duracao", value: track ? formatDuration(track.duration) : "-", inline: true },
        { name: "Volume", value: `${this.volume}%`, inline: true },
        { name: "Loop", value: loopLabel(this.loopMode), inline: true }
      );

    if (track?.thumbnail) embed.setThumbnail(track.thumbnail);
    if (track?.requestedBy) {
      embed.setFooter({ text: `Pedido por ${track.requestedBy}` });
    }

    return embed;
  }

  queueEmbed() {
    const lines = this.queue
      .slice(0, 10)
      .map(
        (track, index) =>
          `**${index + 1}.** ${truncate(track.title, 70)} (${formatDuration(track.duration)})`
      );

    const totalDuration = this.queue.reduce(
      (total, track) => total + (track.duration || 0),
      0
    );

    return new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("Fila")
      .setDescription(lines.length ? lines.join("\n") : "A fila esta vazia.")
      .addFields(
        { name: "Tocando", value: this.current ? truncate(this.current.title, 100) : "Nada", inline: false },
        { name: "Na fila", value: String(this.queue.length), inline: true },
        { name: "Tempo estimado", value: formatDuration(totalDuration), inline: true }
      )
      .setFooter({
        text:
          this.queue.length > 10
            ? `Mostrando 10 de ${this.queue.length} musicas`
            : "Use /play para adicionar mais musicas",
      });
  }

  reportError(error) {
    console.error("Erro no player:", error);
    this.textChannel
      ?.send("Nao consegui tocar essa musica. Vou tentar a proxima da fila.")
      .catch(() => {});
  }
}

function playerControls() {
  return playerControlRows()[0];
}

function playerControlRows() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("music:add")
        .setStyle(ButtonStyle.Success)
        .setEmoji("➕"),
      new ButtonBuilder()
        .setCustomId("music:pause")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏸️"),
      new ButtonBuilder()
        .setCustomId("music:resume")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️"),
      new ButtonBuilder()
        .setCustomId("music:skip")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("⏭️"),
      new ButtonBuilder()
        .setCustomId("music:stop")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("⏹️")
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("music:volume_down")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔉"),
      new ButtonBuilder()
        .setCustomId("music:volume_up")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔊"),
      new ButtonBuilder()
        .setCustomId("music:loop")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔁"),
      new ButtonBuilder()
        .setCustomId("music:shuffle")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔀"),
      new ButtonBuilder()
        .setCustomId("music:queue")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📜")
    ),
  ];
}

function loopLabel(mode) {
  return {
    off: "Desligado",
    track: "Musica atual",
    queue: "Fila inteira",
  }[mode];
}

module.exports = { GuildMusicPlayer, playerControls, playerControlRows, loopLabel };
