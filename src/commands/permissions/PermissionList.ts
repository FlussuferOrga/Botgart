import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import { logger } from "../../util/Logging";
import { createTable } from "../../util/Table";
import { CommandPermission, PermissionType } from "../../mikroorm/entities/CommandPermission";

const LOG = logger();

const CHARSET = "utf-8";
const ATTACHMENT_NAME = "result.txt";

export class PermissionList extends BotgartCommand {
    constructor() {
        super("permissionlist", {
            aliases: ["permissionlist", "permlist"],
            quoted: true,
            args: [],
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        this.createTable(guild)
            .then((value) => new discord.AttachmentBuilder(Buffer.from(value, CHARSET), { name: ATTACHMENT_NAME }))
            .then((attachment) => message.reply({ files: [attachment] }))
            .catch((reason) => LOG.error("Could not create markdown table " + reason));
    }

    private async createTable(guild: discord.Guild) {
        const repo = this.getBotgartClient().commandPermissionRepository;
        const permissions = await repo.getPermissions(guild.id);
        return this.remap(permissions).then((value) => createTable(["Id", "Command", "Receiver", "Value"], value));
    }

    private async resolveReceiver(p: CommandPermission) {
        const guild = await this.getBotgartClient().guilds.fetch(p.guild);
        switch (p.type) {
            case PermissionType.user: {
                const user = await this.getBotgartClient().users.fetch(p.receiver);
                if (user !== null && user != undefined) {
                    return user.username;
                }
                const guildMember = await guild.members.fetch(p.receiver);
                if (guildMember !== null && guildMember != undefined) {
                    return guildMember.nickname;
                }
                break;
            }
            case PermissionType.role: {
                const role = await guild.roles.fetch(p.receiver);
                if (role != undefined) {
                    return role.name;
                }
            }
        }
        return p.receiver;
    }

    private async remap(permissions: CommandPermission[]) {
        return Promise.all(
            permissions.map(async (p) => {
                const newVar = await this.resolveReceiver(p);
                return ["" + p.commandPermissionsId, p.command, p.type + ": " + (newVar || "?"), "" + p.value];
            })
        );
    }
}

module.exports = PermissionList;
