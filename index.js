"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var dotenv = require("dotenv");
var socketIO = require("socket.io");
var TelegramBot = require("node-telegram-bot-api");
var mongodb_1 = require("mongodb");
dotenv.config();
var protocol = require("./protocol");
var telegramBot, mongoConnect, mongoClient;
var io = socketIO(process.env.PORT);
var socketsByUsername = {};
io.on('connection', function (socket) {
    var cacheUsername;
    socket.on(protocol.RECEIVE_USERNAME, function (username) {
        socketsByUsername[username] = {
            username: username,
            socket: socket
        };
        cacheUsername = username;
    });
    socket.on(protocol.SEND_MESSAGE, function (message) { return __awaiter(void 0, void 0, void 0, function () {
        var chatId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getChatIdFromUsername(cacheUsername)];
                case 1:
                    chatId = _a.sent();
                    if (chatId) {
                        telegramBot.sendMessage(chatId, message);
                    }
                    else {
                        // TODO, queue this up?
                        console.log('Tried to send message to ' + this.id + ' but did not have chat_id');
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    socket.on('disconnect', function () {
        delete socketsByUsername[cacheUsername];
    });
});
// telegram 'updates' seem to be transient
// ... if telegram thinks you have received that update
// they will no longer return it in the getUpdates results
var token = process.env.TELEGRAM_BOT_TOKEN;
var mongoUri = process.env.MONGODB_URI;
var dbName = process.env.MONGODB_NAME;
telegramBot = new TelegramBot(token, { polling: true });
// forward messages over the appropriate event on the eventBus
telegramBot.on('message', function (msg) {
    console.log('receiving telegram message from ' + msg.chat.username);
    setUsernameChatIdFromMessage(msg);
    var contactable = socketsByUsername[msg.chat.username];
    if (contactable) {
        contactable.socket.emit(protocol.RECEIVE_MESSAGE, msg.text);
    }
});
// intentionally don't catch error
var mongoOptions = {
    useUnifiedTopology: true,
    useNewUrlParser: true
};
mongodb_1.MongoClient.connect(mongoUri, mongoOptions).then(function (c) {
    mongoConnect = c;
    mongoClient = mongoConnect.db(dbName);
    // process any backlog and save it
    telegramBot.getUpdates()
        .then(function (updates) {
        updates
            .filter(function (u) { return u.message; })
            .map(function (u) { return u.message; })
            .forEach(setUsernameChatIdFromMessage);
    })["catch"](function (e) {
        console.log('failed to call getUpdates');
    });
});
var MONGO_COLLECTION = 'telegram_chat_ids';
// map from telegram usernames to chat ids with the bot
// (hint: the chat id seems to be the same as the user id, interestingly)
function setUsernameChatIdFromMessage(msg) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, username, id, check;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = msg.chat, username = _a.username, id = _a.id;
                    console.log('setting telegram chat_id for username ' + username + ': ' + id);
                    return [4 /*yield*/, getChatIdFromUsername(username)];
                case 1:
                    check = _b.sent();
                    if (!check) {
                        mongoClient.collection(MONGO_COLLECTION).insertOne({
                            chat_id: id,
                            username: username
                        });
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function getChatIdFromUsername(username) {
    return __awaiter(this, void 0, void 0, function () {
        var record;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mongoClient.collection(MONGO_COLLECTION).findOne({ username: username })];
                case 1:
                    record = _a.sent();
                    return [2 /*return*/, record ? record.chat_id : null];
            }
        });
    });
}
