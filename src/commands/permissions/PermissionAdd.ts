import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand.js";
import * as L from "../../Locale.js";
import { logger } from "../../util/Logging.js";
import { PermissionType } from "../../mikroorm/entities/CommandPermission.js";

const LOG = logger();

export default class PermissionAdd extends BotgartCommand {
    constructor() {
        super("permissionadd", {
            aliases: ["permissionadd", "permadd", "permit"],
            quoted: true,
            args: [
                {
                    id: "command",
                    type: "commandAlias",
                },
                {
                    id: "receiver",
                    type: async (message: discord.Message, phrase: string) => {
                        let receiver: discord.GuildMember | discord.User | discord.Role | undefined = undefined;
                        const snowflake = phrase.match(/<@[^\d]?(\d*)>/);
                        if (snowflake !== null) {
                            const snowflakeId: string = snowflake[1];
                            if (message.guild) {
                                // either group or guildmember
                                receiver =
                                    message.guild.roles.cache.find((r) => r.id == snowflakeId) || (await message.guild.members.fetch(snowflakeId)); // cache.find(m => m.id == snowflakeId);
                            } else {
                                // direct message -> user
                                receiver = this.client.users.cache.find((u) => u.id == snowflakeId);
                            }
                        } else if (message.guild) {
                            // plaintext name -> try to resolve among guild members and roles as fallback
                            receiver =
                                message.guild.members.cache.find((m) => m.displayName === phrase) || // might fail!
                                message.guild.roles.cache.find((r) => r.name === phrase);
                        }
                        return receiver;
                    },
                },
                {
                    id: "value",
                    type: "integer",
                },
            ],
            // userPermissions: ["ADMINISTRATOR"]
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const cmd: string = args.command.id;
        const receiver: string = args.receiver.id;
        const type = args.receiver instanceof discord.Role ? PermissionType.role : PermissionType.user;
        const receiverName = args.receiver instanceof discord.Role ? args.receiver.name : args.receiver.displayName;
        const value = args.value;
        const perm = await this.getBotgartClient().commandPermissionRepository.setPermission(
            cmd,
            receiver,
            type,
            value,
            (message.guild as discord.Guild).id
        );
        this.reply(message, responsible, L.get("PERMISSION_SET_TO", [receiverName, cmd, perm.value])).catch((err) => LOG.error(err.message));
    }
}
