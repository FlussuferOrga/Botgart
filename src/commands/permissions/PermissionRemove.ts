import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as L from "../../Locale";
import { logger } from "../../util/Logging";

const LOG = logger();

export class PermissionRemove extends BotgartCommand {
    constructor() {
        super("permissionremove", {
                aliases: ["permissionremove", "permremove"],
                quoted: true,
                args: [
                    {
                        id: "permissionId",
                        type: "number"
                    }
                ]
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const permissionId: number = args.permissionId;
        const number = this.getBotgartClient().commandPermissionRepository.removePermission(permissionId, guild.id);
        if (number > 0) {
            this.reply(message, responsible, L.get("PERMISSION_REMOVED")).catch((err) => LOG.error(err.message));
        }
    }
}

module.exports = PermissionRemove;