declare const RECEIVE_MESSAGE = "receive_message";
declare const SEND_MESSAGE = "send_message";
interface TelegramMessage {
    username: string;
    message: string;
}
export { RECEIVE_MESSAGE, SEND_MESSAGE, TelegramMessage };
