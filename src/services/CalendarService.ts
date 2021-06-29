import discord from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import { logger } from "../util/Logging";
import * as U from "../util/Util";
import moment from "moment-timezone";

const LOG = logger();

type DateTime = string; // RFC3339 timestamp 2021-04-15T05:27:47.000Z

//
enum CalendarEventType {
    NEW, EDITED, DELETED
}

// calendar event as retrieved from Google API (plus one custom field)
export interface CalendarEvent {
   kind: string;
   etag: string;
   id: string;
   status: string; // confirmed, cancelled
   htmlLink: string; // url
   created: DateTime;
   updated: DateTime;
   summary: string;
   description: string;
   creator: { email: string };
   organizer: {
       email: string;
       displayName: string;
       self: boolean
   };
   start: {
       dateTime: DateTime;
   };
   end: {
       dateTime: DateTime;
   },
   iCalUID: string;
   sequence: number;
   eventType: string;
   type: CalendarEventType; // custom field
}

export class CalendarService {
    private static addImage = new discord.MessageAttachment("./rsc/calendar-plus.png", "calendar-plus.png");
    private static editImage = new discord.MessageAttachment("./rsc/calendar-edit.png", "calendar-edit.png");
    private static removeImage = new discord.MessageAttachment("./rsc/calendar-remove.png", "calendar-remove.png");
    private static alertImage = new discord.MessageAttachment("./rsc/calendar-alert.png", "calendar-alert.png");

    private client: BotgartClient;
    private apiKey: string;
    private nextSyncToken: string | undefined;
    private lastSync: moment.Moment;
    public readonly calendarId: string;

    /**
    * @param client: Botgart
    * @param apiKey: Google API key. Doesn't need to be affiliated with any relevant Google-project and does not required any special permissions, as long as the calendar in question is publicly available. Follow https://developers.google.com/maps/documentation/javascript/get-api-key to acquire a key.
    * @param calendarId: the unique indentifier for the Google calendar, complete with scope. E.g. for the public Riverside calendar
    *                    https://calendar.google.com/calendar/u/0/embed?src=i3q7a4qqictbi5dfu64mf0vub0@group.calendar.google.com&ctz=Europe/Berlin
    *                    it would be: "i3q7a4qqictbi5dfu64mf0vub0@group.calendar.google.com".
    */
    constructor(client: BotgartClient, apiKey: string, calendarId: string) {
        this.client = client;
        this.apiKey = apiKey;
        this.calendarId = calendarId;
        this.lastSync = moment()
    }

    /**
    * Produces the API-URL to fetch the events from; complete with GET-parameters.
    * @param nextSyncToken: token to only fetch updated events, see: https://developers.google.com/calendar/v3/reference/events/list
    * @returns the URL to use for a GET-request.
    */
    private url(args: {nextSyncToken?: string, timeMin?: string, timeMax?: string}): string {
        const params = [
            "showDeleted=true",
            "singleEvents=true",
            args.nextSyncToken ? `syncToken=${args.nextSyncToken}` : undefined,
            !args.nextSyncToken && args.timeMin ? `timeMin=${args.timeMin}` : undefined,
            !args.nextSyncToken && args.timeMax ? `timeMin=${args.timeMax}` : undefined
        ].filter(p => p !== undefined).join("&");
        return `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?key=${this.apiKey}&${params}`;
    }

    /**
    * Retrieves all events from the calendar.
    * If the CalendarService instance was used before, it will store the nextSyncToken provided by the API to only retrieve
    * updates since the last retrieval. That token will be used for the next fetch.
    * This behaviour can be disabled to retrieve a full list by using the onlyUpdates parameter.
    * @param onlyUpdates: if true, the CalendarService will attempt to use the nextSyncToken from the last retrieval to only acquire updates since the last call.
    *                     Else, this method will retrieve all events in the calendar. If the nextSyncToken has already expired, the method will fall back to producing a complete list of events.
    *                     Note that the nextSyncToken is neither shared between CalendarService instances targetting the same Google calendar, nor is it persistently stored and will be lost upon restarts.
    * @returns a list of events contained in the calendar this CalendarService instance is responsible for. Depending on the onlyUpdates parameter, either all events are produced or only events that were updated since the last call.
    */
    private async getEvents(onlyUpdates = true): Promise<CalendarEvent[]> {
        if(!onlyUpdates) {
            this.nextSyncToken = undefined;
        }
        let result: CalendarEvent[] = [];
        const json = await U.gets(this.url({nextSyncToken: this.nextSyncToken}));
        this.lastSync = moment();
        const parsed = JSON.parse(json);
        if("error" in parsed) {
            if(parsed.error.code === 410) {
                LOG.info(`Sync token for CalendarService expired. Fetching full list instead.`);
                result = await this.getEvents(false);
            } else {
                LOG.error(`Error when trying to fetch events from calendar ${this.calendarId}: "${parsed.error.message}"`);
            }
        } else {
            result = parsed.items.map(event => {
                if(event.status === "cancelled") {
                    event.type = CalendarEventType.DELETED;
                }
                else if(moment(event.created) < this.lastSync) {
                    event.type = CalendarEventType.EDITED;
                }
                else {
                    event.type = CalendarEventType.NEW;
                }
                return event;
            });
        }
        this.nextSyncToken = parsed.nextSyncToken;
        return result;
    }

    private eventToEmbed(event: CalendarEvent): discord.MessageEmbed {
        const startDate = moment(event.start.dateTime).format("DD.MM.YYYY");
        const endDate = moment(event.end.dateTime).format("DD.MM.YYYY");
        let colour = "#ffffff";
        let emote = "";
        let embedImage = CalendarService.addImage;
        let title = event.summary;

        switch (event.type) {
            case CalendarEventType.NEW:
                colour = "#00ff00";
                emote = "💥";
                embedImage = CalendarService.addImage;
                break;

            case CalendarEventType.EDITED:
                colour = "#ccb51d";
                emote = "✏️";
                embedImage = CalendarService.editImage;
                break;

            case CalendarEventType.DELETED:
                colour = "#ff0000";
                emote = "❌";
                title = `~~${title}~~`;
                embedImage = CalendarService.removeImage;
                break;
        }

        return new discord.MessageEmbed()
            .setColor(colour)
            .attachFiles([embedImage])
            .setImage(`attachment://${embedImage.name}`)
            .setTitle(`${emote} ${event.summary}`)
            .setDescription(event.description ?? "")
            .setURL(event.htmlLink)
            .setAuthor(event.organizer.displayName)
            .addFields(
                { name: "📅", value: (startDate != endDate ? `${startDate} – ${endDate}` : startDate)},
                { name: "🕒", value: `${moment(event.start.dateTime).format("HH:mm")} – ${moment(event.end.dateTime).format("HH:mm")}`}
            );
    }

    public async postCalendarEvents(channel: discord.TextChannel) {
        const embeds = (await this.getEvents()).map(this.eventToEmbed);
        channel.send(embeds[0]);
    }
}
