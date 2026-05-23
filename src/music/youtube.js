const ytdl = require("@distube/ytdl-core");
const ytSearch = require("yt-search");
const youtubedl = require("youtube-dl-exec");
const play = require("play-dl");
const { youtubeCookie } = require("../config");

let agent = null;

function getAgent() {
  if (!youtubeCookie) return undefined;
  if (!agent) {
    agent = ytdl.createAgent([{ name: "cookie", value: youtubeCookie }]);
  }
  return agent;
}

async function resolveTracks(input, requestedBy) {
  if (isYouTubePlaylist(input)) {
    const playlist = await play.playlist_info(input, { incomplete: true });
    const videos = await playlist.all_videos();
    return videos.map((video) => toTrack(video, requestedBy));
  }

  if (ytdl.validateURL(input)) {
    const info = await ytdl.getInfo(input, { agent: getAgent() });
    return [toTrack(info.videoDetails, requestedBy)];
  }

  const results = await ytSearch(input);
  const video = results.videos[0];

  if (!video) return [];
  return [toTrack(video, requestedBy)];
}

function toTrack(video, requestedBy) {
  const id = video.videoId || video.id;
  const url = video.url || video.video_url || buildVideoUrl(id);

  if (!url) {
    throw new Error(`Nao consegui montar a URL do video: ${video.title || "sem titulo"}`);
  }

  return {
    title: video.title || "Sem titulo",
    url,
    id: id || null,
    duration: Number(video.seconds || video.durationInSec || video.lengthSeconds || 0),
    thumbnail: getThumbnail(video),
    requestedBy,
  };
}

async function createTrackStream(track) {
  const url = track.url || buildVideoUrl(track.id);

  if (!url || !ytdl.validateURL(url)) {
    throw new Error(`Musica sem URL valida: ${track.title || "sem titulo"}`);
  }

  const subprocess = youtubedl.exec(
    url,
    {
      output: "-",
      format: "bestaudio/best",
      quiet: true,
      noWarnings: true,
      noPlaylist: true,
    },
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  let streamClosed = false;

  subprocess.stdout?.on("close", () => {
    streamClosed = true;
  });

  subprocess.stderr?.on("data", (chunk) => {
    const message = chunk.toString().trim();
    if (message && !streamClosed) console.error("yt-dlp:", message);
  });

  subprocess.catch?.((error) => {
    if (!subprocess.killed && !streamClosed) {
      console.error("yt-dlp falhou:", error.message);
    }
  });

  return { stream: subprocess.stdout, type: undefined };
}

function getThumbnail(video) {
  if (video.thumbnail) return video.thumbnail;
  if (Array.isArray(video.thumbnails)) {
    const thumbnail = video.thumbnails.at(-1);
    return typeof thumbnail === "string" ? thumbnail : thumbnail?.url;
  }

  return null;
}

function isYouTubePlaylist(input) {
  return /(?:youtube\.com|youtu\.be).*[?&]list=/.test(input);
}

function buildVideoUrl(id) {
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

module.exports = { resolveTracks, createTrackStream };
