# Hospedar no Google Cloud Free Tier

Este bot precisa de uma VM, porque bots de Discord ficam conectados o tempo todo. No Google Cloud, use Compute Engine.

## Criar a VM

1. Acesse o Google Cloud Console.
2. Crie ou selecione um projeto.
3. Ative Billing. O Free Tier exige billing ativo.
4. Va em **Compute Engine > VM instances > Create instance**.
5. Use uma regiao elegivel ao Free Tier nos EUA.
6. Em machine type, escolha **e2-micro**.
7. Sistema: Ubuntu LTS.
8. Disco: Standard persistent disk, ate 30 GB para ficar dentro do Free Tier.
9. Crie a VM.

Documentacao oficial:

- https://cloud.google.com/free/docs/compute-getting-started
- https://docs.cloud.google.com/compute/docs/create-linux-vm-instance

## Instalar o bot

Depois de subir o codigo para o GitHub, abra SSH na VM pelo botao **SSH** do Console e rode:

```bash
git clone https://github.com/SEU_USUARIO/discord-music-bot.git
cd discord-music-bot
bash deploy/google-cloud-setup.sh https://github.com/SEU_USUARIO/discord-music-bot.git
```

Edite o `.env`:

```bash
nano ~/discord-music-bot/.env
```

Preencha:

```env
DISCORD_TOKEN=seu_token
CLIENT_ID=seu_client_id
GUILD_ID=seu_servidor
```

Inicie:

```bash
cd ~/discord-music-bot
npm run deploy
pm2 start src/index.js --name discord-music-bot
pm2 save
pm2 startup
```

O comando `pm2 startup` mostra um comando com `sudo`. Copie e rode esse comando para o bot voltar sozinho quando a VM reiniciar.

## Comandos uteis

```bash
pm2 status
pm2 logs discord-music-bot
pm2 restart discord-music-bot
pm2 stop discord-music-bot
```

## Cuidado com cobranca

Para reduzir risco de custo:

- Use somente **e2-micro**.
- Use regiao elegivel ao Free Tier.
- Use disco standard dentro do limite gratuito.
- Nao adicione GPU, balanceador, IP extra, snapshots grandes ou discos extras.
- Configure budget alert no Billing.
