import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand.js";
import * as L from "../../Locale.js";
import { logger } from "../../util/Logging.js";

const LOG = logger();

export default class PermissionRemove extends BotgartCommand {
    constructor() {
        super("permissionremove", {
            aliases: ["permissionremove", "permremove"],
            quoted: true,
            args: [
                {
                    id: "permissionId",
                    type: "number",
                },
            ],
        });
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const permissionId: number = args.permissionId;
        await this.getBotgartClient().commandPermissionRepository.removePermission(permissionId, guild.id);
        await this.reply(message, responsible, L.get("PERMISSION_REMOVED")).catch((err) => LOG.error(err.message));
    }
}
