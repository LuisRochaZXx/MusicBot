const { REST, Routes } = require("discord.js");
const { commands } = require("./commands");
const { token, clientId, guildId } = require("./config");

const rest = new REST({ version: "10" }).setToken(token);

async function main() {
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);

  console.log(
    guildId
      ? `Registrando ${commands.length} comandos no servidor ${guildId}...`
      : `Registrando ${commands.length} comandos globais...`
  );

  await rest.put(route, { body: commands });

  console.log("Comandos registrados com sucesso.");
}

main().catch((error) => {
  console.error("Falha ao registrar comandos:", error);
  process.exit(1);
});
