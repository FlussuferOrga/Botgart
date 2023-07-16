import * as discord from "discord.js";
import { BotgartCommand } from "../../../BotgartCommand";
import * as L from "../../../Locale";
import { logger } from "../../../util/Logging";
import * as ResetUtil from "../ResetUtil";

const LOG = logger();

/**
 Testcases:

 */

export class ResetRoster extends BotgartCommand {
    constructor() {
        super(
            "resetroster",
            {
                aliases: ["resetroster"],
                channel: "guild",
                args: [
                    {
                        id: "channel",
                        type: "channel",
                    },
                    {
                        id: "weekNumber",
                        type: "integer",
                        default: undefined,
                    },
                    {
                        id: "year",
                        type: "integer",
                        default: undefined,
                    },
                ],
                // userPermissions: ["ADMINISTRATOR"]
            },
            {
                cronable: true,
            }
        );
    }

    checkArgs(args) {
        return !args?.channel || !(args.channel instanceof discord.TextChannel) ? L.get(this.helptextKey()) : undefined;
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const currentWeek = ResetUtil.currentWeek();
        const rosterWeek = !args.weekNumber || args.weekNumber < currentWeek ? currentWeek : args.weekNumber;
        const rosterYear = !args.year ? ResetUtil.currentYear() : args.year;

        const client = this.getBotgartClient();

        const dbEntry = await client.rosterRepository.getRosterPost(guild, rosterWeek, rosterYear);

        if (dbEntry === undefined) {
            // no roster for this guild+week -> create one
            await client.rosterService.createRoster(guild, args.channel, rosterYear, rosterWeek);
        } else {
            const [, dbChannel, dbMessage] = dbEntry;
            // there is already a roster-post for this guild+week -> do nothing, log warning
            LOG.warn(
                `Tried to initialise roster-post for calendar week ${rosterWeek} for guild '${guild.name}' in channel '${args.channel.name}'. But there is already such a post in channel '${dbChannel.name}'`
            );
            await this.reply(message, responsible, L.get("ROSTER_EXISTS", [dbMessage.url]));
        }
    }

    serialiseArgs(args) {
        const clone = { ...args };
        clone.channel = { guild: args.channel.guild.id, channel: args.channel.id };
        return JSON.stringify(clone);
    }

    deserialiseArgs(jsonargs) {
        const args = JSON.parse(jsonargs);
        const guild: discord.Guild | undefined = this.client.guilds.cache.find((g) => g.id == args.channel.guild);
        if (guild === undefined) {
            LOG.warn(`The guild with id ${args.channel.id} which is put down as roster argument is unknown to me. Have I been kicked?`);
            args.channel = undefined;
        } else {
            args.channel = guild.channels.cache.find((c) => c.id == args.channel.channel);
        }
        return args;
    }
}

module.exports = ResetRoster;
