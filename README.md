# rsf-telegram-bot

Commands

Build Typescript
```
npm run build
```

Build Typescript and "watch" (keep rebuilding when files change)
```
npm run build-watch
```

Start the server
```
npm start
```


## Environment Variables

You will need a [telegram bot](https://core.telegram.org/bots#6-botfather) and its auth token.

You will need to install `mongodb`. The mongo database will persist the IDs of chat threads with users, so that the bot will be able to message with them, even after it restarts. This is because the bot can only send messages to users whose chat IDs it already knows, the user having already messaged it.

Create a `.env` file, and the following environment variables can be set.
```
# the port to run the server on
PORT = 3000
# the private auth token of the telegram bot 
TELEGRAM_BOT_TOKEN = xxx
# the URI of the mongodb database
MONGODB_URI = mongodb://xxx
# the name of the mongodb database
MONGODB_NAME = xxx 
```
