# mioki

A simple NapCat OneBot v11 framework.

> [!CAUTION]
> This project is still under active development. Use it at your own risk.

## Usage of mioki

### 1. Deploy a NapCat Instance

It forwards port 3001 to 3333, mioki use `3333` as default port to connect NapCat WebSocket server.

```bash
docker run -d \
  -e NAPCAT_GID=$(id -g) \
  -e NAPCAT_UID=$(id -u) \
  -p 3333:3001 \
  -p 6099:6099 \
  --name napcat \
  --restart=always \
  mlikiowa/napcat-docker:latest
```

> PS: The image is 500+ MB, so it may take some time to download.

Visit http://localhost:6099, and navigate to "Network Settings" to add a new WebSocket server, using the `3001` port and `0.0.0.0` host in docker. Make sure to enable it after adding. Keep the token you set here, you'll need it to connect mioki to NapCat.

<img src="./docs/napcat-ws-config.png" title="napcat-websocket" alt="napcat-websocket" style="width: 300px; max-width: 300px; border-radius: 4px; border: none;" />

### 2. Create a mioki Project

```bash
mkdir bot && cd bot
npm init -y && npm install mioki
echo "import('mioki').then(({ start }) => start())" > app.ts
```

### 3. Configure mioki

Update `package.json` to add `mioki` field to configure mioki options.

```json
{
  "mioki": {
    "owners": [114514],
    "admins": [],
    "plugins": [],
    "online_push": true,
    "napcat": {
      "protocol": "ws",
      "host": "localhost",
      "port": 3333,
      "token": "your-napcat-token",
    }
  }
}
```

### 4. Run the Bot

```bash
# or `bun app.ts`, `tsx app.ts`, etc.
node app.ts 
```

## License

MIT License © 2025-PRESENT Viki
