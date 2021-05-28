import * as discord from "discord.js";
import { MessageAttachment } from "discord.js";
import { BotgartCommand, PermissionTypes } from "../../BotgartCommand";
import { Permission } from "../../repositories/CommandPermissionRepository";
import { logger } from "../../util/Logging";
import { createTable } from "../../util/Table";

const LOG = logger();

const CHARSET = "utf-8";
const ATTACHEMENT_NAME = "result.txt";

export class PermissionList extends BotgartCommand {
    constructor() {
        super("permissionlist", {
                aliases: ["permissionlist", "permlist"],
                quoted: true,
                args: []
            }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): void {
        this.createTable(guild)
            .then(value => new MessageAttachment(Buffer.from(value, CHARSET), ATTACHEMENT_NAME))
            .then(attachement => message.reply(attachement))
            .catch(reason => LOG.error("Could not create markdown table " + reason));
    }

    private async createTable(guild: discord.Guild) {
        const repo = this.getBotgartClient().commandPermissionRepository;
        const permissions = repo.getPermissions(guild.id);
        return this.remap(permissions)
            .then(value => createTable(["Id", "Command", "Receiver", "Value"], value));
    }

    private async resolveReceiver(p: Permission) {
        const guild = await this.getBotgartClient().guilds.fetch(p.guild, true, false);
        switch (p.type) {
            case PermissionTypes.user: {
                const user = await this.getBotgartClient().users.fetch(p.receiver);
                if (user !== null && user != undefined) {
                    return user.username;
                }
                const guildMember = await guild.member(p.receiver)?.fetch();
                if (guildMember !== null && guildMember != undefined) {
                    return guildMember.nickname;
                }
                break;
            }
            case PermissionTypes.role: {
                const role = await guild.roles.fetch(p.receiver);
                if (role != undefined) {
                    return role.name;
                }
            }
        }
        return p.receiver;
    }

    private async remap(permissions: Permission[]) {
        return Promise.all(permissions.map(async p => {
            const newVar = await this.resolveReceiver(p);
            return ["" + p.command_permissions_id, p.command, p.type + ": " + (newVar || "?"), "" + p.value];
        }));
    }
}

module.exports = PermissionList;