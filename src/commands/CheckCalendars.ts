import * as discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";

/**
 Testcases:

 */
export class CheckCalendars extends BotgartCommand {
    constructor() {
        super("checkcalendars", {
                aliases: ["checkcalendars"],
                quoted: true,
                args: [
                    {
                        id: "channel",
                        type: "textChannel"
                    },
                    {
                        id: "calendarId",
                        type: "string",
                        default: " " // null, undefined, and empty strings are considered invalid arguments in BotgartCommand#checkArgs(). So this serves as a workaround for an "optional" string parameter.
                    }
                ],
            },
            {
                cronable: true
            }
        );
    }

    async command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args): Promise<void> {
        const cid = args.calendarId.trim();
        const calendars = cid === ""
                            ? this.getBotgartClient().calendarServices
                            : this.getBotgartClient().calendarServices.filter(cs => cs.calendarId === cid);
        for(const cal of calendars) {
            cal.postCalendarEvents(args.channel);
        }
    }
}

module.exports = CheckCalendars;