import { Message } from "discord.js";

export function deleteMessageDelay(message: Message): void;

export function setReplyDeleteTimeout(guildId: string, timeout: number): void;
