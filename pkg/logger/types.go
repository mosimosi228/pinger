package logger

type LoggerHandler string

const PrettyType LoggerHandler = "pretty"
const ConsoleType LoggerHandler = "console"
const FileType LoggerHandler = "file"
const TelegramType LoggerHandler = "telegram"
