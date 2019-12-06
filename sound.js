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
var DeepSpeech = require("deepspeech");
var concat = require("concat-stream");
var Sox = require("sox-stream");
var MemoryStream = require("memory-stream");
var stream_1 = require("stream");
var BEAM_WIDTH = 1024;
var modelPath = './models/output_graph.pbmm';
var model = new DeepSpeech.Model(modelPath, BEAM_WIDTH);
var desiredSampleRate = model.sampleRate();
var LM_ALPHA = 0.75;
var LM_BETA = 1.85;
var lmPath = './models/lm.binary';
var triePath = './models/trie';
// set up the model
model.enableDecoderWithLM(lmPath, triePath, LM_ALPHA, LM_BETA);
// function transcribeAudio(audioBuffer: Buffer): string {
//   const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate)
//   console.log('audio length', audioLength)
// }
// utility
function bufferToStream(buffer) {
    var stream = new stream_1.Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
function convertAudio(buffer) {
    return new Promise(function (resolve, reject) {
        var audioStream = new MemoryStream();
        var soxConverter = Sox({
            global: {
                'no-dither': true,
                'replay-gain': 'off'
            },
            output: {
                bits: 16,
                rate: desiredSampleRate,
                channels: 1,
                encoding: 'signed-integer',
                endian: 'little',
                compression: 0.0,
                type: 'raw'
            }
        });
        bufferToStream(buffer)
            .pipe(soxConverter)
            .pipe(audioStream);
        audioStream.on('finish', function () {
            var convertedAudioBuffer = audioStream.toBuffer();
            resolve(convertedAudioBuffer);
        });
        audioStream.on('error', function (e) {
            reject(e);
        });
    });
}
var speechToText = function (telegramBot, msg) {
    return new Promise(function (resolve, reject) {
        var convertAndTranscribe = function (orig) { return __awaiter(void 0, void 0, void 0, function () {
            var converted, e_1, transcript;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, convertAudio(orig)];
                    case 1:
                        converted = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        reject(e_1);
                        return [2 /*return*/];
                    case 3:
                        transcript = model.stt(converted.slice(0, converted.length / 2));
                        console.log('transcript!', transcript);
                        // send it back...
                        telegramBot.sendMessage(msg.chat.id, transcript);
                        resolve(transcript);
                        return [2 /*return*/];
                }
            });
        }); };
        var fileStream = telegramBot.getFileStream(msg.voice.file_id);
        fileStream.pipe(concat(convertAndTranscribe));
        fileStream.on('error', reject);
    });
};
exports.speechToText = speechToText;
