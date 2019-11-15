import * as dotenv from 'dotenv'
import * as socketIO from 'socket.io'
import * as TelegramBot from 'node-telegram-bot-api'
import { MongoClient } from 'mongodb'
dotenv.config()

import { SEND_MESSAGE, RECEIVE_MESSAGE, TelegramMessage } from './protocol'

let telegramBot, mongoConnect, mongoClient
const io = socketIO(process.env.PORT)

io.on('connection', (socket) => {
  socket.on(SEND_MESSAGE, async (telegramMessage: TelegramMessage) => {
    const { username, message } = telegramMessage
    const chatId = await getChatIdFromUsername(username)
    if (chatId) {
      telegramBot.sendMessage(chatId, message)
    } else {
      // TODO, queue this up?
      console.log('Tried to send message to ' + this.id + ' but did not have chat_id')
    }
  })
})

// telegram 'updates' seem to be transient
// ... if telegram thinks you have received that update
// they will no longer return it in the getUpdates results

const token = process.env.TELEGRAM_BOT_TOKEN
const mongoUri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_NAME

telegramBot = new TelegramBot(token, { polling: true })

// forward messages over the appropriate event on the eventBus
telegramBot.on('message', (msg) => {
  console.log('receiving telegram message from ' + msg.chat.username)
  setUsernameChatIdFromMessage(msg)
  const telegramMessage: TelegramMessage = {
    username: msg.chat.username,
    message: msg.text
  }
  // send to all connected sockets
  io.sockets.emit(RECEIVE_MESSAGE, telegramMessage)
})

// intentionally don't catch error
const mongoOptions = {
  useUnifiedTopology: true,
  useNewUrlParser: true
}
MongoClient.connect(mongoUri, mongoOptions).then((c) => {
  mongoConnect = c
  mongoClient = mongoConnect.db(dbName)

  // process any backlog and save it
  telegramBot.getUpdates()
    .then((updates) => {
      updates
        .filter((u) => u.message)
        .map((u) => u.message)
        .forEach(setUsernameChatIdFromMessage)
    })
    .catch((e) => {
      console.log('failed to call getUpdates')
    })
})

const MONGO_COLLECTION = 'telegram_chat_ids'

// map from telegram usernames to chat ids with the bot
// (hint: the chat id seems to be the same as the user id, interestingly)
async function setUsernameChatIdFromMessage (msg) {
  const { username, id } = msg.chat
  console.log('setting telegram chat_id for username ' + username + ': ' + id)
  const check = await getChatIdFromUsername(username)
  if (!check) {
    mongoClient.collection(MONGO_COLLECTION).insertOne({
      chat_id: id,
      username
    })
  }
}

async function getChatIdFromUsername (username: string) {
  const record = await mongoClient.collection(MONGO_COLLECTION).findOne({ username })
  return record ? record.chat_id : null
}