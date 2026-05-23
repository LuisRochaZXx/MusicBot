# Bot pessoal de musica para Discord

Bot em Node.js com `discord.js` v14, slash commands, botoes de controle e player de voz para YouTube.

## Funcoes

- `/play` com link, busca ou playlist do YouTube
- `/pause`, `/resume`, `/skip`, `/stop`
- `/queue`, `/nowplaying`, `/clear`
- `/controls` para abrir um painel de botoes no chat atual, inclusive no chat de texto do canal de voz
- `/volume`, `/loop`, `/shuffle`
- `/remove`, `/move`
- `/join`, `/leave`, `/help`
- Botoes no card da musica: pausar, continuar, pular, parar e ver fila
- Botoes extras no painel: adicionar musica, volume, loop e embaralhar

## Requisitos

- Node.js 20 ou mais novo
- Um bot criado no Discord Developer Portal
- O bot precisa das permissoes: `View Channels`, `Send Messages`, `Use Slash Commands`, `Connect` e `Speak`

## Configuracao

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env` e preencha:

```env
DISCORD_TOKEN=token_do_bot
CLIENT_ID=application_client_id
GUILD_ID=id_do_servidor_para_testes
```

3. No Discord Developer Portal:

- Em **Bot**, copie o token.
- Em **OAuth2 > General**, copie o `Client ID`.
- Em **OAuth2 > URL Generator**, marque `bot` e `applications.commands`.
- Em permissoes do bot, marque `View Channels`, `Send Messages`, `Use Slash Commands`, `Connect` e `Speak`.
- Abra o link gerado e adicione no seu servidor.

4. Registre os comandos:

```bash
npm run deploy
```

5. Inicie o bot:

```bash
npm start
```

## Observacoes importantes

- O bot usa slash commands, entao nao precisa do intent privilegiado `Message Content`.
- Para uso pessoal, `GUILD_ID` deixa os comandos aparecerem quase na hora. Sem `GUILD_ID`, os comandos globais podem demorar para propagar.
- O YouTube muda com frequencia. Se algum video falhar, tente atualizar dependencias com `npm update`.
- Use somente conteudo que voce tem permissao para reproduzir e respeite os termos do Discord e do YouTube.
