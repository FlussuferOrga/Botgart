/* eslint-disable max-lines */
import { logger as logger1 } from "./util/Logging.js";
import discord from "discord.js";

const logger = logger1();

let EN: { [key: string]: string } = {
    HELPTEXT_PREFIX: "Please use the command with the following parameters:\n",
};

EN = {
    ...EN,
    ...{
        INTERNAL_ERROR: "An internal error occured. Please contact an administrator about this.",

        HTTP_REQUEST_RETURNED: "The response to your request has returned: `{0}`",

        NOT_PERMITTED: "You do not have the required permissions to execute this command.",
        PERMISSION_SET_TO: "Permission for `{0}` for command `{1}` set to **{2}**.",
        PERMISSION_REMOVED: "Permission removed.",
        WELCOME:
            "Welcome to the Riverside-Discord. :)\n Much of this server isn't accessible to for guests. Please authenticate using an API-key:\n\n1. Visit <https://account.arena.net/applications>\n2. Click 'new key'\n3. Post `,auth` followed by your new key per direct message (this window) to me.\n\nEg: `,auth 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111`.",
        NO_SUCH_COMMAND: "I don't know the command '{0}' you gave me.",
        NOT_AVAILABLE_AS_DM: "This command is not usable as direct message. Please try it again within a server.",
        NOT_CRONABLE: "This command can not be used in a cronjob.",
        NO_DEL_PERM: "I could not delete your last message. Please remove it yourself for security reasons.",
        KEY_INVALID_FORMAT: "Please give me a valid API-key. You can acquire one at <https://account.arena.net/>.",
        KEY_ACCEPTED: "Welcome to Riverside Discord!",
        KEY_DECLINED: "The account you gave me is not situated on Riverside (or a valid linked server) or the API-key is invalid.",
        KEY_NOT_UNIQUE:
            "The API-key you gave me is already in use. Please generate a new key.\nRemove the old key at <https://account.arena.net/>, if you don't know about it being used.",
        KEY_INVALIDATED:
            "Hi!\nThe API-key you gave me is no longer considered valid.\nI thereby remove your access for the internal channels. You can re-register any time with a valid API-key.",
        AUTH_ONLY_PM: "Please do not share you API key in a public channel. Please use this private chat instead.",
        CHECKING_KEY: "Checking API-key...",
        REG_ROLE_NOT_FOUND: "The assigned role does not exist. Please inform an administrator about this.",
        PRUNING_COMPLETE: "API-keys are now beeing re-validated. This can take a while.",
        FIND_DUPLICATES_COMPLETE: "Duplicate search complete.",
        GUILD_LOG_COMPLETE: "Guild log has successfully be retrieved.",
        PERMANENT_ROLE_ADD_SUCC: "Permanent role has successfully been added.",
        PERMANENT_ROLE_ADD_FAIL: "Permanent role could not be added. Maybe the role is already permanent for that user.",
        PERMANENT_ROLE_RM_SUCC: "Permanent role was successfully removed.",
        PERMANENT_ROLE_RM_FAIL: "Permanent role could not be removed.",
        WHOIS_EMPTY_RESULT: "No results found.",
        WHOIS_RESULTS: "The following possible results were found:",
        DLOG_AUTH: "User {0} with ingame account `{1}` has been authorised with role {2}.",
        DLOG_UNAUTH: "User {0} with ingame account `{1}` has been de-authorised and lost their role {2}.",

        CRONJOB_STORED: "Your cronjob has been saved with ID `{0}`. Next execution: `{1}`.",
        CRONJOB_NOT_STORED:
            "Your cronjob could not be created. Either the command is not available for crons, or the time you gave me is invalid. Please check <https://crontab.guru/> in the latter case.",
        CRONJOB_DELETED: "The cronjob has been deleted.",
        CRONJOB_NOT_DELETED: "The cronjob could not be deleted.",

        FAQ_STORED: "The FAQ entry has been created.",
        FAQ_NOT_STORED: "The FAQ-entry could not be created.",
        FAQ_DELETED: "The FAQ entry for '{0}' has been deleted.",
        FAQ_NOT_DELETED: "The FAQ entry for '{0}' could not be deleted.",
        FAQ_NOT_FOUND: "There is no FAQ-entry for the keyword '{0}'.",
        CIRCULAR_CRON: "Cronjobs can not be recursive for security reasons.",
        TS_UNREGISTER_SENT: "Successfully sent request to remove TS registration.",

        GUILD_LOG_PERMISSION_FAIL: "I need the API-key of a guild leader to retrieve the guild log.",

        HELPTEXT_AUTHENTICATE:
            EN["HELPTEXT_PREFIX"] +
            "GW2 API key with the permissions 'account' and 'characters', which you can retrieve from <https://account.arena.net/applications>",
        HELPTEXT_PERMISSION_ADD:
            EN["HELPTEXT_PREFIX"] +
            '`"<name or alias of a command>" "<snowflake or name of the player or role (MUST EXIST)>" <numerical permission value, positive to allow, negative to disallow>`',
        HELPTEXT_PERMISSION_LIST: EN["HELPTEXT_PREFIX"] + "",
        HELPTEXT_PERMISSION_REMOVE: EN["HELPTEXT_PREFIX"] + "`<id of permission>`",
        HELPTEXT_SAY: EN["HELPTEXT_PREFIX"] + '`<Channel, in which the bot should speak> "<Text to speak>"`.',
        HELPTEXT_MAKE_CRON:
            EN["HELPTEXT_PREFIX"] +
            '"`<Cron-Scheduling-String (UNIX-Format)>`" "`<Command to execute>`" `<Parameters for that command as specified by the help text>`.',
        HELPTEXT_DELETE_CRON: EN["HELPTEXT_PREFIX"] + "`<ID of the cronjob to delete>`\nIDs of all cronjobs can be found with the `lscrons`-command.",
        HELPTEXT_POLL: EN["HELPTEXT_PREFIX"] + '`<Channel to create the poll in> "<Question for the poll>" "<Emotes available for voting>"`.',
        HELPTEXT_MAKE_FAQ: EN["HELPTEXT_PREFIX"] + '`"<Keywords to link to the entry, separated with semicolons (;)>` `"<FAQ text>"`.',
        HELPTEXT_GET_FAQ: EN["HELPTEXT_PREFIX"] + "`<Keyword>`",
        HELPTEXT_DELETE_FAQ: EN["HELPTEXT_PREFIX"] + "`<Keyword>`",
        HELPTEXT_PIPE_GUILD_LOG: EN["HELPTEXT_PREFIX"] + '"`<Name of the guild>`" `<API-key of the leader>` `<Channel to pipe the log to>`',
        HELPTEXT_ADD_PERMANENT_ROLE: EN["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        HELPTEXT_REMOVE_PERMANENT_ROLE: EN["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        HELPTEXT_WHOIS: EN["HELPTEXT_PREFIX"] + "`<part of an account- or discord-name (at least three characters!)>`",
        HELPTEXT_DISCORD_LOG: EN["HELPTEXT_PREFIX"] + "`<arbitary event type>` `<text channel to which messages of EN type should be directed>`",
        HELPTEXT_REMOVE_DISCORD_LOG:
            EN["HELPTEXT_PREFIX"] + "`<arbitary event type>` `<text channel from which messages of EN type should be removed (optional)>`",
        HELPTEXT_LIST_DISCORD_LOG: EN["HELPTEXT_PREFIX"] + "`<Text channel from which existing message types are to be displayed (optional)>`",
        HELPTEXT_PRUNE:
            EN["HELPTEXT_PREFIX"] +
            "`<number of days to be considered inactive (1 <= n <= 30)>` `<text the pruned members should receive as private message>`",
        HELPTEXT_RESET_ROSTER:
            EN["HELPTEXT_PREFIX"] +
            "`<Channel, in which the post should be created>` (`<number of week for the roster, default: current week>`) (`year for the roster, default: current year`)",
        HELPTEXT_ADD_RESET_LEADER: EN["HELPTEXT_PREFIX"] + "`<player to add (any text)>` `<{0}>` `<week number (optional)>` `<year (optional)>`",
        HELPTEXT_TOGGLE_RESET_LEADER_VISIBILITY:
            EN["HELPTEXT_PREFIX"] + "`<player to add (any text)>` `<{0}>` `<week number (optional)>` `<year (optional)>`",
        HELPTEXT_REMOVE_RESET_LEADER: EN["HELPTEXT_PREFIX"] + "`<player to add (any text)>` `<week number (optional)>` `<year (optional)>`",
        HELPTEXT_SET_TS3_RESET_ROSTER: "",
        HELPTEXT_DELETE_TS_REGISTRATION: EN["HELPTEXT_PREFIX"] + "`<GW2 account name>`",
        HELPTEXT_GO_FISH: EN["HELPTEXT_PREFIX"] + "",
        HELPTEXT_FISHING_LADDER: EN["HELPTEXT_PREFIX"] + "",
        HELPTEXT_REACTION_SNAPSHOT:
            EN["HELPTEXT_PREFIX"] + "`<URL to the post that should be snapshoted (bot must have access to the guild, channel and post!)>`",
        HELPTEXT_TS_GUILD_ADD:
            EN["HELPTEXT_PREFIX"] +
            '"`<name of the guild>`" "`<accounts of the contact persons, comma separated, must follow the format foo.1234>`" "`<TS group (optional, default is the guild tag)>`"',
        HELPTEXT_TS_GUILD_DELETE: EN["HELPTEXT_PREFIX"] + "`<name of the guild>`",
        HELPTEXT_GUILD_CHANNEL_LIST: EN["HELPTEXT_PREFIX"] + "",

        DESC_DELETE_CRON: "Deletes the cronjob with the given ID.",
        DESC_LIST_CRONS: "Lists all cronjobs.",
        DESC_MAKE_CRON: "Creates a new cronjob for the given timestamp.",
        DESC_AUTHENTICATE: "Authenticates the user with a GW2-API-key.",
        DESC_POLL: "Creates a poll with preselected emotes for voting.",
        DESC_REAUTHENTICATE: "Re-authenticates all GW2-API-keys again.",
        DESC_SAY: "Speaks the given text in a channel.",
        DESC_HELP: "This command. Lists all available commands with a short description.",
        DESC_TS_SYNC: "Syncs all roles with the TS3-Server (_INACTIVE_).",
        DESC_MAKE_FAQ: "Adds a new FAQ entry.",
        DESC_DELETE_FAQ: "Removes an entry from the FAQ.",
        DESC_GET_FAQ: "Gives the FAQ entry to a keyword.",
        DESC_LIST_FAQS: "Lists all FAQ entries.",
        DESC_FIND_DUPLICATES: "Finds all Discord users sharing one GW2 account..",
        DESC_PIPE_GUILD_LOG: "Pipes the guild log of a guild to a Discord channel.",
        DESC_REPAIR_ROLES: "Gives all users the role they have been assigned as per the database.",
        DESC_ADD_PERMANENT_ROLE: "Permanently gives a user a role he will be assigned even if he rejoins the server.",
        DESC_REMOVE_PERMANENT_ROLE: "Removes a permanent role from a user, so that they won't have it assigned again upon rejoining the server.",
        DESC_WHOIS: "Looks up the pair of Discord name and ingame name.",
        DESC_DISCORD_LOG: "Sets up the connection between an event-type and a Discord-text-channel.",
        DESC_REMOVE_DISCORD_LOG: "Removed the connection between an event-type and a Discord-text-channel.",
        DESC_LIST_DISCORD_LOG: "Displays a list of the event types available in the Discord-text-channel.",
        DESC_PRUNE: "Prunes inactive users without roles.",
        DESC_RESET_ROSTER: "Creates a post for commanders to roster.",
        DESC_ADD_RESET_LEADER: "Manually adds a player as reset lead.",
        DESC_REMOVE_RESET_LEADER: "Manually removes a player as reset lead.",
        DESC_TOGGLE_RESET_LEADER_VISIBILITY: "Toggles the visibility of a reset leader.",
        DESC_SET_TS3_RESET_ROSTER: "Syncs the current reset roster to TS3.",
        DESC_ADD_EVENT: "Creates a new event.",
        DESC_DELETE_TS_REGISTRATION: "Deletes all TS registrations from a GW2 account.",
        DESC_GO_FISH: "Head out for a relaxing day at the riverside.",
        DESC_FISHING_LADDER: "Lists the most successful anglers. Ordered by the weight of their total caught fish.",
        DESC_REACTION_SNAPSHOT: "Lists the current reactions on a given posts.",
        DESC_TS_GUILD_ADD: "Creates a new Guild on the TS server.",
        DESC_TS_GUILD_DELETE: "Deletes a guild from the TS server.",
        DESC_FIND_UNREGISTERED: "Find users, that are assigned a server role, but are not found in the database.",
        DESC_PERMISSION_ADD: "Grants or revokes permissions for a role or user to use a command.",
        DESC_PERMISSION_LIST: "List all set permissions.",
        DESC_PERMISSION_REMOVE: "Removes a permission by it's Id",
        DESC_GUILD_CHAN: "Values depend on server start time and might not be correct",
        DESC_GUILD_CHANNEL_LIST: "Lists guild channels and activity in ts",

        MK_GUILD_CONFIRM: "Your request:\n**Name:** {0}\n**Contact:** {1}\n**TS-Group:** {2}\nIs this correct?",
        MK_GUILD_CONFIRM_NO_GROUP: "Your request:\n**Name:** {0}\n**Contact:** {1}\nIs this correct?",
        MK_GUILD_TIMEOUT: "The time for input ran out and guild creation was canceled. You can start over the event creation.",
        MK_GUILD_CANCELED: "Guild creation has been canceled.",
        MK_GUILD_COMPLETE: "Guild creation request has been sent to TS.",
        MK_GUILD_UNKNOWN_GUILD: "No guild named '{0}' exists in the game. Make sure you did not misspell the name and used proper capitalisation.",

        RM_GUILD_COMPLETE: "Guild removal request has been sent to TS.",

        COOLDOWN_GO_FISH: "You are still totally relaxed from your last fishing trip. Wait another {0} second(s). :relieved:",

        COMMANDER_TAG_UP: "Commander **{0}** ({1}) tagged up in TeamSpeak!",
        COMMANDER_TAG_UP_TEAMSPEAK_LINK_TEXT: "Join on TeamSpeak",
        COMMANDER_TAG_UP_TEAMSPEAK_LINK_ALT: "If you have TeamSpeak 3 installed, you can join by clicking this link.",
        COMMANDER_TAG_UP_TYPE_PPK: "Fighting",
        COMMANDER_TAG_UP_TYPE_PPT: "Capture & defend objectives",
        COMMANDER_TAG_UP_TIMES: "Times",

        RED_BORDERLANDS: "Red Borderlands",
        BLUE_BORDERLANDS: "Blue Borderlands",
        GREEN_BORDERLANDS: "Green Borderlands",
        ETERNAL_BATTLEGROUNDS: "Eternal Battlegrounds",
        RESETLEAD_HEADER:
            "React with one of these emotes to set yourself as reset lead. React with ❌ to withdraw your lead. Use 📣 if you are fine with your map being forwarded to our enemies.",
        ROSTER_EXISTS: "There is already a roster for that week: {0}",
        WEEK_NUMBER: "Week Number",
        ROSTER_LEAD_ADDED: "Player `{0}` has successfully been added as reset lead for the map `{1}` on week {2}. See {3}",
        ROSTER_LEAD_REMOVED: "Player `{0}` has successfully been removed as reset lead for week {1}. See {2}",
        ROSTER_LEAD_VISIBILITY_TOGGLED: "Player `{0}`'s visibility for week {1} has been toggled. See {2}",

        MK_EVENT_DATE: "Enter a valid date with time next. E.g. `15.02.2022 16:33`",
        MK_EVENT_TITLE: "Enter a title for the event now.",
        MK_EVENT_DESC: "Enter a short description for the event.",
        MK_EVENT_REMINDER:
            "If you want to have an automatic reminder posted for your event, enter how many minutes before the event the reminder should be posted. If you do not want to have reminder, enter a negative number instead.",
        MK_EVENT_TIMEOUT: "The time for input ran out and event creation was canceled. You can start over the event creation.",

        FISHING_IDLE_TITLE: "Fishing",
        FISHING_IDLE_DESCRIPTION: "Sit back and relax. But watch for your blinker! Click :fishing_pole_and_fish: once it pops up!",

        FISHING_ESCAPED_TITLE: "Escaped",
        FISHING_ESCAPED_DESCRIPTION:
            "You were too relaxed and the fish got away. But you had a nice, relaxing fishing trip anyway and the fish gets to swim home to its family.",

        FISHING_CAUGHT_TITLE: "Caught",
        FISHING_CAUGHT_DESCRIPTION: "You caught something! What a masterful angler you are!",

        TS_REGISTRATIONS_DELETED: "`{0}` Registrations have been deleted.",
    },
};

let DE: { [key: string]: string } = {
    HELPTEXT_PREFIX: "Bitte benutze den Befehle mit folgenden Parametern:\n",
};

DE = {
    ...DE,
    ...{
        INTERNAL_ERROR:
            "Ein interner Fehler ist aufgetreten. Bitte benachrichtige einen Administrator, damit dieser sich des Problems annehmen kann.",

        HTTP_REQUEST_RETURNED: "Deine Anfrage wurde abgeschlossen. `{0}`",

        NOT_PERMITTED: "Du hast nicht die nötigen Berechtigungen um diesen Befehl auszuführen.",
        PERMISSION_REMOVED: "Berechtigung entfernt.",
        PERMISSION_SET_TO: "Berechtigung für `{0}` auf Befehl `{1}` ist jetzt **{2}**.",
        WELCOME:
            'Herzlich willkommen auf dem Flussufer-Discord! :)\nEin Großteil des Servers ist für Gäste nicht zugänglich. Bitte authentifiziere dich mittels eines API-Keys:\n\n1. Besuche dazu <https://account.arena.net/applications>\n2. Klicke auf "Neuer Schlüssel"\n3. Poste `,auth ` gefolgt von deinem neuen Schlüssel per Direktnachricht (dieses Fenster) an mich.\n\nZ.B: `,auth 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111`.',
        NO_SUCH_COMMAND: "Den von dir angegebenen Befehl '{0}' kenne ich nicht.",
        NOT_AVAILABLE_AS_DM: "Dieser Befehl ist per Privatnachricht nicht nutzbar. Bitte versuche es auf einem Server erneut.",
        NOT_CRONABLE: "Dieser Befehl kann nicht als Teil eines Cronjobs verwendet werden.",
        NO_DEL_PERM: "Ich kann leider keine Nachrichten löschen. Bitte entferne aus Sicherheitsgründen deine letzte Nachricht manuell.",
        KEY_INVALID_FORMAT: "Bitte gib mir einen gültigen API-Key. Diesen erhältst du auf <https://account.arena.net/>.",
        KEY_ACCEPTED: "Herzlich willkommen auf dem Flussufer Discord!",
        KEY_DECLINED:
            "Der von dir angegebene Account ist derzeit nicht auf Flussufer bzw. einem eingetragenem Linking Server angesiedelt oder ist kein gültiger API-Key.",
        KEY_NOT_UNIQUE:
            "Der von dir angegebene API-Key ist leider schon in Benutzung. Bitte generiere einen neuen Key.\nEntferne den alten Key auf <https://account.arena.net/>, falls dir dessen Nutzung nicht bekannt ist.",
        KEY_INVALIDATED:
            "Hallo!\nDer von dir angegebene API-Key ist nicht mehr auf Flussufer oder einem gültigen Linkingserver.\nDaher müssen wir dir leider die Zugangsrechte für den privaten Bereich entziehen. Du kannst dich gerne jederzeit mit einem neuen API-Key authentifizieren.",
        AUTH_ONLY_PM: "Bitte teile deinen API-Key nicht in einem öffentlichen Kanal. Nutze dafür bitte diesen privaten Chat.",
        CHECKING_KEY: "Prüfe API-Key...",
        REG_ROLE_NOT_FOUND: "Die eingestellte Rolle existiert nicht auf dem Server. Bitte informiere einen Administrator.",
        PRUNING_COMPLETE: "API-Keys werden nun re-validiert. Das kann eine Weile dauern.",
        FIND_DUPLICATES_COMPLETE: "Duplikatsuche abgeschlossen.",
        GUILD_LOG_COMPLETE: "Gilden-Logbuch erfolgreich abgerufen.",
        PERMANENT_ROLE_ADD_SUCC: "Die permanente Rolle wurde erfolgreich hinzugefügt.",
        PERMANENT_ROLE_ADD_FAIL:
            "Die permanente Rolle konnte nicht hinzugefügt werden. Möglicherweise ist diese Rolle bereits permanent dem Benutzer zugewiesen.",
        PERMANENT_ROLE_RM_SUCC: "Die permanente Rolle wurde erfolgreich entfernt.",
        PERMANENT_ROLE_RM_FAIL: "Die permanente Rolle konnte nicht entfernt werden.",
        WHOIS_EMPTY_RESULT: "Keine Treffer gefunden.",
        WHOIS_RESULTS: "Die folgenden möglichen Treffer wurden gefunden:",
        DLOG_AUTH: "Benutzer {0} mit dem Ingame-Account `{1}` wurde mit der Rolle {2} autorisiert.",
        DLOG_UNAUTH: "Benutzer {0} mit dem Ingame-Account `{1}` wurde ent-autorisiert und hat die Rolle {2} verloren.",

        CRONJOB_STORED: "Dein Cronjob wurde gespeichert mit der ID `{0}`. Nächste Ausführung: `{1}`.",
        CRONJOB_NOT_STORED:
            "Dein Cronjob konnte nicht erstellt werden. Entweder, der Befehl ist für Cronjobs nicht verfügbar oder die von dir übergebene Zeitangabe ist ungültig. Du kannst diese auf <https://crontab.guru/> überprüfen.",
        CRONJOB_DELETED: "Der Cronjob wurde gelöscht.",
        CRONJOB_NOT_DELETED: "Der Cronjob konnte nicht gelöscht werden.",

        FAQ_STORED: "Der FAQ-Eintrag wurde erstellt.",
        FAQ_NOT_STORED: "Der FAQ-Eintrag konnte nicht erstellt werden.",
        FAQ_DELETED: "Der FAQ-Eintrag für '{0}' wurde gelöscht.",
        FAQ_NOT_DELETED: "Der FAQ-Eintrag für '{0}' konnte nicht gelöscht werden.",
        FAQ_NOT_FOUND: "Es gibt keinen FAQ-Eintrag zu dem Stichwort '{0}'.",
        CIRCULAR_CRON: "Cronjobs dürfen aus Sicherheitsgründen selbst keine Cronjobs schedulen.",
        TS_UNREGISTER_SENT: "Anfrage die TS-Registrierung zu löschen wurde erfolgreich abgeschickt.",

        GUILD_LOG_PERMISSION_FAIL: "Für das Abrufen des Gilden-Logbuchs muss ein API-Key des Anführers hinterlegt sein.",

        HELPTEXT_AUTHENTICATE:
            DE["HELPTEXT_PREFIX"] +
            "GW2 API-Key mit den Berechtigungen 'account' und 'characters', den du unter <https://account.arena.net/applications> erhalten kannst.",
        HELPTEXT_PERMISSION_ADD:
            DE["HELPTEXT_PREFIX"] +
            "`<Name oder Alias des Befehls> <Name des Spielers oder der Rolle oder Snowflake (MUSS EXISTIEREN)> <numerischer Berechtigungs-Wert, positiv um zu erlauben, negativ um zu verbieten>`",
        HELPTEXT_PERMISSION_LIST: EN["HELPTEXT_PREFIX"] + "",
        HELPTEXT_PERMISSION_REMOVE: EN["HELPTEXT_PREFIX"] + "`<id der Berechtigung>`",
        HELPTEXT_SAY: DE["HELPTEXT_PREFIX"] + '`<Channel, in dem der Bot sprechen soll> "<Text, den der Bot abschicken soll>"`.',
        HELPTEXT_MAKE_CRON:
            DE["HELPTEXT_PREFIX"] +
            '`<Cron-Scheduling-String (UNIX-Format)>`" "`<Befehl, der gescheduled werden soll>`" `<Parameter für den vorausgehenden Befehl, entsprechend dessen Hilfetext>`.',
        HELPTEXT_DELETE_CRON:
            DE["HELPTEXT_PREFIX"] +
            "`<ID des Cronjobs, der gelöscht werden soll>`\nIDs aller Cronjobs kannst du mit dem `lscrons`-Befehl anzeigen lassen.",
        HELPTEXT_POLL:
            DE["HELPTEXT_PREFIX"] +
            '`<Channel, in dem der Poll erstellt werden soll> "<Frage, um die es im Poll geht>" "<Emotes, die zur Reaktion zur Verfügung stehen sollen>"`.',
        HELPTEXT_MAKE_FAQ:
            DE["HELPTEXT_PREFIX"] +
            '`"<Schüsselwörter, die mit der Antwort verknüpft werden sollen. Werden am Semikolon (;) getrennt>` `"<Text, der angezeigt werden sollen>"`.',
        HELPTEXT_GET_FAQ: DE["HELPTEXT_PREFIX"] + "`<Schüsselwort>`",
        HELPTEXT_DELETE_FAQ: DE["HELPTEXT_PREFIX"] + "`<Schüsselwort>`",
        HELPTEXT_PIPE_GUILD_LOG:
            DE["HELPTEXT_PREFIX"] + '"`<Name der Gilde>`" `<API Key des Anführers>` `<Channel, in dem der Log geschrieben werden soll>`',
        HELPTEXT_ADD_PERMANENT_ROLE: DE["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        HELPTEXT_REMOVE_PERMANENT_ROLE: DE["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        HELPTEXT_WHOIS: DE["HELPTEXT_PREFIX"] + "`<Teilname des Accounts oder Discord-Namens (mindestens drei Buchstaben!)>`",
        HELPTEXT_DISCORD_LOG: DE["HELPTEXT_PREFIX"] + "`<Eventtyp (beliebig)>` `<Textkanal, in dem Nachrichten dieses Typs geleitet werden sollen>`",
        HELPTEXT_REMOVE_DISCORD_LOG:
            DE["HELPTEXT_PREFIX"] + "`<Eventtyp (beliebig)>` `<Textkanal, aus dem Nachrichten dieses Typs entfernt werden sollen (optional)>`",
        HELPTEXT_LIST_DISCORD_LOG: DE["HELPTEXT_PREFIX"] + "`<Textkanal, aus dem vorhandene Meldungstypen angezeigt werden sollen (optional)>`",
        HELPTEXT_PRUNE:
            DE["HELPTEXT_PREFIX"] +
            "`<Anzahl Offline-Tage bis ein Benutzer als inaktiv angesehen wird (1 <= n <= 30)>` `<Text, den entfernte Benutzer als Privatnachricht erhalten>`",
        HELPTEXT_RESET_ROSTER:
            DE["HELPTEXT_PREFIX"] +
            "`<Channel, in dem der Post erstellt werden soll>` (`Kalenderwoche für den Reset, Standard: aktuelle Woche`) (`Jahr für den Reset, Standard: aktuelles Jahr`)",
        HELPTEXT_ADD_RESET_LEADER:
            DE["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<{0}>` `<Kalenderwoche (optional)>` `<Jahr (optional)>`",
        HELPTEXT_TOGGLE_RESET_LEADER_VISIBILITY:
            DE["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<Kalenderwoche (optional)` `<Jahr (optional)>`",
        HELPTEXT_REMOVE_RESET_LEADER: DE["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<Kalenderwoche (optional)>`",
        HELPTEXT_SET_TS3_RESET_ROSTER: "",
        HELPTEXT_DELETE_TS_REGISTRATION: DE["HELPTEXT_PREFIX"] + "`<GW2 Accountname>`",
        HELPTEXT_GO_FISH: DE["HELPTEXT_PREFIX"] + "",
        HELPTEXT_FISHING_LADDER: DE["HELPTEXT_PREFIX"] + "",
        HELPTEXT_REACTION_SNAPSHOT:
            DE["HELPTEXT_PREFIX"] +
            "`<URL zum Post, von dem ein Snapshot erstellt werden soll (der Bot muss Zugang zur Gilde, zum Kanal und zu der Nachricht haben!)>`",
        HELPTEXT_TS_GUILD_ADD:
            DE["HELPTEXT_PREFIX"] +
            '"`<Name der Gilde>`" "`<Accounts der Ansprechpartner, mit Komma voneinander getrennt, muss dem Format foo.1234 folgen>`" "`<TS-Gruppe (optional, als Standardwert wird das Tag der Gilde verwendet)>`"',
        HELPTEXT_TS_GUILD_DELETE: DE["HELPTEXT_PREFIX"] + "`<Name der Gilde>`",
        HELPTEXT_GUILD_CHANNEL_LIST: DE["HELPTEXT_PREFIX"] + "",

        DESC_DELETE_CRON: "Löscht den Cronjob mit der angegebenen ID.",
        DESC_LIST_CRONS: "Listet alle offenen Cronjobs auf.",
        DESC_MAKE_CRON: "Erstellt einen neuen Cronjob auf den angegebenen Zeitpunkt.",
        DESC_AUTHENTICATE: "Authentifiziert einen Benutzer mittels eines GW2-API-Keys.",
        DESC_POLL: "Erstellt einen Poll mit vorgegebenen Emotes als Abstimmoptionen.",
        DESC_REAUTHENTICATE: "Authentifiziert alle vorhandenen GW2-API-Keys erneut.",
        DESC_SAY: "Spricht den übergebenen Text im übergebenen Channel.",
        DESC_HELP: "Dieser Befehl. Listet alle verfügbaren Befehle mit einer kurzen Beschreibung auf.",
        DESC_TS_SYNC: "Synchronisiert die Rollen mit dem TeamSpeak3-Server (_NICHT AKTIV_).",
        DESC_MAKE_FAQ: "Fügt den FAQ einen Eintrag hinzu.",
        DESC_DELETE_FAQ: "Entfernt einen Eintrag von den FAQ.",
        DESC_GET_FAQ: "Gibt die Antwort zu einem Stichwort der FAQ wieder.",
        DESC_LIST_FAQS: "Listet alle vorhandenen FAQs auf.",
        DESC_FIND_DUPLICATES: "Findet alle Discord-Benutzer, die sich einen GW2-Account teilen.",
        DESC_PIPE_GUILD_LOG: "Schreibt den Guildlog einer Gilde in einen Discord-Channel.",
        DESC_REPAIR_ROLES: "Gibt allen Benutzern die Rolle, die in der Datenbank für sie hinterlegt ist.",
        DESC_ADD_PERMANENT_ROLE:
            "Fügt einem Benutzer permanent eine Rolle hinzu, die ihm beim erneuten Betreten des Servers automatisch wieder zugewiesen wird.",
        DESC_REMOVE_PERMANENT_ROLE:
            "Löst eine permanente Rolle von einem Benutzer, sodass diese ihm beim Betreten des Servers nicht automatisch erneut zugewiesen wird.",
        DESC_WHOIS: "Ermittelt ein Tupel aus Discord-Name and Ingame-Name.",
        DESC_DISCORD_LOG: "Erstellt eine Verbindung zwischen einem Event-Typ und einem Discord-Text-Kanal.",
        DESC_REMOVE_DISCORD_LOG: "Entfernt eine Verbindung zwischen einem Event-Typ und einem Discord-Text-Kanal.",
        DESC_LIST_DISCORD_LOG: "Listet die im Discord-Text-Kanal vorhandenen Eventtypen auf.",
        DESC_PRUNE: "Entfernt inaktive Benutzer ohne Rolle.",
        DESC_RESET_ROSTER: "Erstellt einen Post, mithilfe dessen Kommandeur*innen rostern können.",
        DESC_ADD_RESET_LEADER: "Fügt manuell einen Spieler als Reset-Kommandeur*in hinzu.",
        DESC_REMOVE_RESET_LEADER: "Entfernt manuell einen Spieler von den Reset-Kommandeur*innen.",
        DESC_TOGGLE_RESET_LEADER_VISIBILITY: "Ändert manuell die Sichtbarkeit eines oder einer Reset-Kommandeur*in.",
        DESC_SET_TS3_RESET_ROSTER: "Syncronisiert das aktuelle Resetroster ins TS3.",
        DESC_ADD_EVENT: "Erstellt ein neues Event",
        DESC_DELETE_TS_REGISTRATION: "Löscht alle Registrierungen im TS anhand eines GW2 Accounts.",
        DESC_GO_FISH: "Begib dich auf eine entspannte Angeltour am Flussufer.",
        DESC_FISHING_LADDER: "Listet die erfolgreichsten Fischer auf. Sortiert nach Gesamtgewicht der gefangenen Fische.",
        DESC_REACTION_SNAPSHOT: "Listet die momentanen Reaktionen eines bestimmten Posts auf.",
        DESC_TS_GUILD_ADD: "Erstellt eine neue Gilde auf dem TeamSpeak-Server.",
        DESC_TS_GUILD_DELETE: "Lösche eine Gilde vom TeamSpeak-Server",
        DESC_FIND_UNREGISTERED: "Finde Nutzer, die eine Serverrolle haben, aber nicht in der Datenbank zu finden sind.",
        DESC_PERMISSION_ADD: "Vergibt oder entzieht einer Rolle oder einem Benutzer oder einer Rolle Berechtigungen für Befehle.",
        DESC_PERMISSION_LIST: "Listet alle gesetzen Berechtigungen auf",
        DESC_PERMISSION_REMOVE: "Entfernt eine Berechtigung anhand ihrer Id.",
        DESC_GUILD_CHAN: "Werte hängen von Server Startzeit ab und könnten deshalb falsch sein",
        DESC_GUILD_CHANNEL_LIST: "Listet Gildenkanäle und deren Aktivität im TS",

        MK_GUILD_CONFIRM: "Deine Anfrage:\n**Name:** {0}\n**Kontakt:** {1}\n**TS-Gruppe:** {2}\nIst das so in Ordnung?",
        MK_GUILD_CONFIRM_NO_GROUP: "Deine Anfrage:\n**Name:** {0}\n**Kontakt:** {1}\nIst das so in Ordnung?",
        MK_GUILD_TIMEOUT:
            "Das Zeitlimit für die Eingabe wurde überschritten und die Gilden-Erstellung abgebrochen. Du kannst den Prozess erneut starten.",
        MK_GUILD_CANCELED: "Gildenerstellung wurde abgebrochen.",
        MK_GUILD_COMPLETE: "Anfrage zum Anlegen einer Gilde wurde an den TeamSpeak-Server gesendet",
        MK_GUILD_UNKNOWN_GUILD:
            "Es gibt keine Gilde namens '{0}' im Spiel. Stell bitte sicher, dass du dich nicht verschrieben hast und achte auf korrekte Groß-/ Kleinschreibung.",

        RM_GUILD_COMPLETE: "Anfrage zum Löschen einer Gilde wurde an den TeamSpeak-Server gesendet.",

        COOLDOWN_GO_FISH: "Du bist noch sehr entspannt von deinem letzten Angelausflug. Warte noch {0} Sekunde(n). :relieved:",

        COMMANDER_TAG_UP: "Kommandeur*in **{0}** ({1}) hat im TeamSpeak einen Raid gestartet!",
        COMMANDER_TAG_UP_TEAMSPEAK_LINK_TEXT: "Auf dem TeamSpeak beitreten",
        COMMANDER_TAG_UP_TEAMSPEAK_LINK_ALT: "Wenn du TeamSpeak 3 installiert hast, kannst du über diesen Link dem/der Kommandeur*in beitreten.",
        COMMANDER_TAG_UP_TYPE_PPK: "Kämpfen",
        COMMANDER_TAG_UP_TYPE_PPT: "Ziele erobern & verteidigen",
        COMMANDER_TAG_UP_TIMES: "Zeiten",

        RED_BORDERLANDS: "Rote Grenzlande",
        BLUE_BORDERLANDS: "Blaue Grenzlande",
        GREEN_BORDERLANDS: "Grüne Grenzlande",
        ETERNAL_BATTLEGROUNDS: "Ewige Schlachtfelder",
        RESETLEAD_HEADER:
            "Reagiere mit einem der Emotes, um dich als Reset-Kommandeur*in einzutragen. Reagiere mit ❌ um dich wieder auszutragen. Benutze 📣, wenn du damit einverstanden bist, dass deine Karte unseren Gegnern mitgeteilt wird.",
        ROSTER_EXISTS: "Es gibt bereits ein Roster für diese Woche: {0}",
        WEEK_NUMBER: "Kalenderwoche",
        ROSTER_LEAD_ADDED: "Spieler `{0}` wurde erfolgreich als Kommandeur*in für die Karte `{1}` in der Woche {2} hinzugefügt. Siehe {3}",
        ROSTER_LEAD_REMOVED: "Spieler `{0}` wurde erfolgreich als Kommandeur*in in der Woche {1} entfernt. Siehe {2}",
        ROSTER_LEAD_VISIBILITY_TOGGLED: "Spieler `{0}`s Sichtbarkeit in Woche {1} wurde geändert. Siehe {2}",

        MK_EVENT_DATE: "Gib als nächstes ein gültiges Datum mit Uhrzeit an. Z.B. `15.02.2022 16:33`",
        MK_EVENT_TITLE: "Gib jetzt einen Titel für das Event an.",
        MK_EVENT_DESC: "Gib nun eine kurze Beschreibung für das Event an.",
        MK_EVENT_REMINDER:
            "Falls automatisch eine Erinnerung gepostet werden soll, gib jetzt an, wie viele Minuten vor dem Event das geschehen soll. Gib eine negative Zahl an, falls du keine Erinnerung möchtest.",
        MK_EVENT_TIMEOUT:
            "Das Zeitlimit für die Eingabe wurde überschritten und die Event-Erstellung abgebrochen. Du kannst den Prozess erneut starten.",

        FISHING_IDLE_TITLE: "Angeln",
        FISHING_IDLE_DESCRIPTION:
            "Lehn dich zurück und entspann dich. Aber achte auf deine Angel! Klicke schnell auf :fishing_pole_and_fish: wenn es auftaucht!",

        FISHING_ESCAPED_TITLE: "Entwischt",
        FISHING_ESCAPED_DESCRIPTION:
            "Du warst zu entspannt und der Fisch ist entkommen. Aber du hattest trotzdem einen schönen Angelausflug und der Fisch darf sich darauf freuen, seine Familie wiederzusehen.",

        FISHING_CAUGHT_TITLE: "Gefangen",
        FISHING_CAUGHT_DESCRIPTION: "Du hast etwas gefangen! Was für ein meisterlicher Angler du bist!",

        TS_REGISTRATIONS_DELETED: "Es wurden `{0}` Registrierungen gelöscht.",
    },
};

let DE_SWG: { [key: string]: string } = {
    HELPTEXT_PREFIX: "Des machsch so:\n",
};

DE_SWG = {
    ...DE_SWG,
    ...{
        INTERNAL_ERROR: "Mir hend en interne Fehler. Sagsch em Admin bscheid.",

        HTTP_REQUEST_RETURNED: "Die Antwort auf dei Frog isch: `{0}`",

        NOT_PERMITTED: "Des derfsch net.",
        PERMISSION_SET_TO: "Berechtigung für `{0}` auf de Befehl `{1}` isch jetzt **{2}**.",
        PERMISSION_REMOVED: "Berechtigung isch jetzt weg.",
        WELCOME:
            'Grüß Gott aufm Flussufer-Discord! :)\nEs moischt hier kannsch als Gascht net sehe. Bitte authentifiziere dich mit erem API-Key:\n\n1. Bsuch dazu <https://account.arena.net/applications>\n2. Dann drücksch auf "Neuer Schlüssel"\n3. Na schreibsch `,auth ` gefolgt von deim neue Schlüssel per Direktnachricht (dieses Fenster) an mi.\n\nZ.B: `,auth 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111`.',
        NO_SUCH_COMMAND: "'{0}' kenn i net.",
        NOT_AVAILABLE_AS_DM: "Des kannsch net innere Privatnachricht mache. Probiersch nochamol aufm Server.",
        NOT_CRONABLE: "Des kannsch net als Cronjob mache.",
        NO_DEL_PERM: "Nachrichten derf i net lösche. Machsch dein letscht Nachricht bitte selbscht weg.",
        KEY_INVALID_FORMAT: "Gibsch mer bitte en gültige API-Key. Den kriegsch auf <https://account.arena.net/>.",
        KEY_ACCEPTED: "Servus, Flussufler! Liesch dir bitte die Informationen im INFOCENTER durch, damit des hier gescheid nutze kannsch. :)",
        KEY_DECLINED: "Des isch koin Account auf Flussufer oder nedemol en gültiger API-Key.",
        KEY_NOT_UNIQUE:
            "Den API-Key hemmer scho. Machsch bitte en neue.\nWennd net weisch, wie mir an den Key komme sind, löscht den grad selbscht auf <https://account.arena.net/>.",
        KEY_INVALIDATED: "Hallo!\nDein API-Key isch nimmer auf Flussufer.\nMir schmeißed dich deswege naus. Kannsch aber wiederkomme, wennd willsch.",
        CHECKING_KEY: "Ich guggemol...",
        REG_ROLE_NOT_FOUND: "Die Rolle henn mer ned. Sagsch bitte em Admin bscheid.",
        PRUNING_COMPLETE: "Ich gugg mir jetzt die API-Keys an. Des kann sau lang daure.",
        FIND_DUPLICATES_COMPLETE: "Duplikatsuche ferdich.",
        GUILD_LOG_COMPLETE: "Gilden-Logbuch erfolgreich abgerufen.",
        PERMANENT_ROLE_ADD_SUCC: "Han ich permanent drangeklebt.",
        PERMANENT_ROLE_ADD_FAIL: "Konnt ich net permanent drankleben. Vielleicht het er die scho.",
        PERMANENT_ROLE_RM_SUCC: "Han ich erfolgreich weggemacht.",
        PERMANENT_ROLE_RM_FAIL: "Konnt ich net wegmachen.",
        WHOIS_EMPTY_RESULT: "Han nix gfunde.",
        WHOIS_RESULTS: "Des han ich gfunde:",
        DLOG_AUTH: "Benutzer {0} mit dem Ingame-Account `{1}` han ich mit der Rolle {2} autorisiert.",
        DLOG_UNAUTH: "Benutzer {0} mit dem Ingame-Account `{1}` han ich ent-autorisiert und er het die Rolle {2} verloren.",

        CRONJOB_STORED: "Deinen Cronjob han ich mir gemerkt mit der ID `{0}`. Snächscht mal: `{1}`.",
        CRONJOB_NOT_STORED:
            "Den Cronjob konnt ich net erstellen. Befehl für Cronjobs nicht möglich oder du hasch die Zeitangabe verkackt. Schausch mal auf <https://crontab.guru/>.",
        CRONJOB_DELETED: "Cronjob hats verrisse.",
        CRONJOB_NOT_DELETED: "Den Cronjob kann i net lösche.",

        FAQ_STORED: "Den FAQ-Eintrag han ich erstellt.",
        FAQ_NOT_STORED: "Den FAQ-Eintrag konntmer net erstellen.",
        FAQ_DELETED: "Den FAQ-Eintrag für '{0}' han ich glöscht.",
        FAQ_NOT_DELETED: "Den FAQ-Eintrag für '{0}' konntmer net löschen.",
        FAQ_NOT_FOUND: "Mir hennd kein FAQ-Eintrag zu '{0}'.",
        CIRCULAR_CRON: "Cronjobs kenned koin annern Cronjob mache, du Seggel.",
        TS_UNREGISTER_SENT: "Die Anfrag han ich grad weitergleitet.",

        GUILD_LOG_PERMISSION_FAIL: "Für das Abrufen des Gilden-Logbuchs muss ein API-Key des Anführers hinterlegt sein.",

        HELPTEXT_AUTHENTICATE:
            DE_SWG["HELPTEXT_PREFIX"] + "'en GW2 API-Key mit 'account' und 'characters', den kriegsch auf <https://account.arena.net/applications>",
        HELPTEXT_PERMISSION_ADD:
            DE_SWG["HELPTEXT_PREFIX"] +
            "`<Name oder Alias des Befehls> <Name des Spielers oder der Rolle oder Snowflake (MUSS EXISTIEREN)> <numerischer Berechtigungs-Wert, positiv um zu erlauben, negativ um zu verbieten>`",
        HELPTEXT_PERMISSION_LIST: EN["HELPTEXT_PREFIX"] + "",
        HELPTEXT_PERMISSION_REMOVE: EN["HELPTEXT_PREFIX"] + "`<id der Berechtigung>`",
        HELPTEXT_SAY: DE_SWG["HELPTEXT_PREFIX"] + '`<Channel, in dem der Bot sprechen soll> "<Text, den der Bot abschicken soll>"`.',
        HELPTEXT_MAKE_CRON:
            DE_SWG["HELPTEXT_PREFIX"] +
            '`<Cron-Scheduling-String (UNIX-Format)>`" "`<Befehl, der gescheduled werden soll>`" `<Parameter für den vorausgehenden Befehl, entsprechend dessen Hilfetext>`.',
        HELPTEXT_DELETE_CRON:
            DE_SWG["HELPTEXT_PREFIX"] +
            "`<ID des Cronjobs, der gelöscht werden soll>`\nIDs aller Cronjobs kannst du mit dem `lscrons`-Befehl anzeigen lassen.",
        HELPTEXT_POLL:
            DE_SWG["HELPTEXT_PREFIX"] +
            '`<Channel, in dem der Poll erstellt werden soll> "<Frage, um die es im Poll geht>" "<Emotes, die zur Reaktion zur Verfügung stehen sollen>"`.',
        HELPTEXT_MAKE_FAQ:
            DE_SWG["HELPTEXT_PREFIX"] +
            '`"<Schüsselwörter, die mit der Antwort verknüpft werden sollen. Werden am Semikolon (;) getrennt>` `"<Text, der angezeigt werden sollen>"`.',
        HELPTEXT_GET_FAQ: DE_SWG["HELPTEXT_PREFIX"] + "`<Schüsselwort>`",
        HELPTEXT_DELETE_FAQ: DE_SWG["HELPTEXT_PREFIX"] + "`<Schüsselwort>`",
        HELPTEXT_PIPE_GUILD_LOG:
            DE_SWG["HELPTEXT_PREFIX"] + '"`<Name der Gilde>`" `<API Key des Anführers>` `<Channel, in dem der Log geschrieben werden soll>`',
        HELPTEXT_ADD_PERMANENT_ROLE: DE_SWG["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        HELPTEXT_REMOVE_PERMANENT_ROLE: DE_SWG["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        HELPTEXT_WHOIS: DE_SWG["HELPTEXT_PREFIX"] + "`<Teilname des Accounts oder Discord-Namens (mindestens drei Buchstaben!)>`",
        HELPTEXT_DISCORD_LOG:
            DE_SWG["HELPTEXT_PREFIX"] + "`<Eventtyp (beliebig)>` `<Textkanal, in dem Nachrichten dieses Typs geleitet werden sollen>`",
        HELPTEXT_REMOVE_DISCORD_LOG:
            DE_SWG["HELPTEXT_PREFIX"] + "`<Eventtyp (beliebig)>` `<Textkanal, aus dem Nachrichten dieses Typs entfernt werden sollen (optional)>`",
        HELPTEXT_LIST_DISCORD_LOG: DE_SWG["HELPTEXT_PREFIX"] + "`<Textkanal, aus dem vorhandene Meldungstypen angezeigt werden sollen (optional)>`",
        HELPTEXT_PRUNE:
            DE_SWG["HELPTEXT_PREFIX"] +
            "`<Anzahl Offline-Tage bis ein Benutzer als inaktiv angesehen wird (1 <= n <= 30)>` `<Text, den entfernte Benutzer als Privatnachricht erhalten>`",
        HELPTEXT_RESET_ROSTER:
            DE_SWG["HELPTEXT_PREFIX"] +
            "`<Channel, in dem der Post erstellt werden soll>` (`Kalenderwoche für den Reset, Standard: aktuelle Woche`) (`Jahr für den Reset, Standard: aktuelles Jahr`)",
        HELPTEXT_ADD_RESET_LEADER:
            DE_SWG["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<{0}>` `<Kalenderwoche (optional)>` `<Jahr (optional)>`",
        HELPTEXT_TOGGLE_RESET_LEADER_VISIBILITY:
            DE_SWG["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<Kalenderwoche (optional)` `<Jahr (optional)>`",
        HELPTEXT_REMOVE_RESET_LEADER: DE_SWG["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<Kalenderwoche (optional)>`",
        HELPTEXT_SET_TS3_RESET_ROSTER: "",
        HELPTEXT_DELETE_TS_REGISTRATION: DE_SWG["HELPTEXT_PREFIX"] + "`<GW2 Accountname>`",
        HELPTEXT_GO_FISH: DE_SWG["HELPTEXT_PREFIX"] + "",
        HELPTEXT_FISHING_LADDER: DE_SWG["HELPTEXT_PREFIX"] + "",
        HELPTEXT_REACTION_SNAPSHOT:
            DE_SWG["HELPTEXT_PREFIX"] +
            "`<URL zum Post, von dem ein Snapshot erstellt werden soll (der Bot muss Zugang zur Gilde, zum Kanal und zu der Nachricht haben!)>`",
        HELPTEXT_TS_GUILD_ADD:
            DE_SWG["HELPTEXT_PREFIX"] +
            '"`<Name der Gilde>`" "`<Accounts der Ansprechpartner, mit Komma voneinander getrennt, muss dem Format foo.1234 folgen>`" "`<TS-Gruppe (optional, als Standardwert wird das Tag der Gilde verwendet)>`"',
        HELPTEXT_TS_GUILD_DELETE: DE_SWG["HELPTEXT_PREFIX"] + "`<Name der Gilde>`",
        HELPTEXT_GUILD_CHANNEL_LIST: DE_SWG["HELPTEXT_PREFIX"] + "",

        DESC_DELETE_CRON: "Löscht den Cronjob mit der angegebenen ID.",
        DESC_LIST_CRONS: "Listet alle offenen Cronjobs auf.",
        DESC_MAKE_CRON: "Erstellt einen neuen Cronjob auf den angegebenen Zeitpunkt.",
        DESC_AUTHENTICATE: "Authentifiziert einen Benutzer mittels eines GW2-API-Keys.",
        DESC_POLL: "Erstellt einen Poll mit vorgegebenen Emotes als Abstimmoptionen.",
        DESC_REAUTHENTICATE: "Authentifiziert alle vorhandenen GW2-API-Keys erneut.",
        DESC_SAY: "Spricht den übergebenen Text im übergebenen Channel.",
        DESC_HELP: "Dieser Befehl. Listet alle verfügbaren Befehle mit einer kurzen Beschreibung auf.",
        DESC_TS_SYNC: "Synchronisiert die Rollen mit dem TeamSpeak3-Server (_NICHT AKTIV_).",
        DESC_MAKE_FAQ: "Fügt den FAQ einen Eintrag hinzu.",
        DESC_DELETE_FAQ: "Entfernt einen Eintrag von den FAQ.",
        DESC_GET_FAQ: "Gibt die Antwort zu einem Stichwort der FAQ wieder.",
        DESC_LIST_FAQS: "Listet alle vorhandenen FAQs auf.",
        DESC_FIND_DUPLICATES: "Findet alle Discord-Benutzer, die sich einen GW2-Account teilen.",
        DESC_PIPE_GUILD_LOG: "Schreibt den Guildlog einer Gilde in einen Discord-Channel.",
        DESC_REPAIR_ROLES: "Gibt allen Benutzern die Rolle, die in der Datenbank für sie hinterlegt ist.",
        DESC_ADD_PERMANENT_ROLE:
            "Fügt einem Benutzer permanent eine Rolle hinzu, die ihm beim erneuten Betreten des Servers automatisch wieder zugewiesen wird.",
        DESC_REMOVE_PERMANENT_ROLE:
            "Löst eine permanente Rolle von einem Benutzer, sodass diese ihm beim Betreten des Servers nicht automatisch erneut zugewiesen wird.",
        DESC_WHOIS: "Ermittelt ein Tupel aus Discord-Name and Ingame-Name.",
        DESC_DISCORD_LOG: "Erstellt eine Verbindung zwischen einem Event-Typ und einem Discord-Text-Kanal.",
        DESC_RERMOVE_DISCORD_LOG: "Entfernt eine Verbindung zwischen einem Event-Typ und einem Discord-Text-Kanal.",
        DESC_LIST_DISCORD_LOG: "Listet die im Discord-Text-Kanal vorhandenen Eventtypen auf.",
        DESC_PRUNE: "Entfernt inaktive Benutzer ohne Rolle.",
        DESC_RESET_ROSTER: "Erstellt einen Post, mithilfe dessen Kommandeure rostern können.",
        DESC_ADD_RESET_LEADER: "Fügt manuell einen Spieler als Reset-Kommandeur hinzu.",
        DESC_REMOVE_RESET_LEADER: "Entfernt manuell einen Spieler von den Reset-Kommandeuren.",
        DESC_TOGGLE_RESET_LEADER_VISIBILITY: "Ändert manuell die Sichtbarkeit eines Reset-Kommandeurs.",
        DESC_SET_TS3_RESET_ROSTER: "Syncronisiert das aktuelle Resetroster ins TS3.",
        DESC_ADD_EVENT: "Erstellt ein neues Event",
        DESC_DELETE_TS_REGISTRATION: "Löscht alle Registrierungen im TS anhand eines GW2 Accounts.",
        DESC_GO_FISH: "Begib dich auf eine entspannte Angeltour am Flussufer.",
        DESC_FISHING_LADDER: "Listet die erfolgreichsten Fischer auf. Sortiert nach Gesamtgewicht der gefangenen Fische.",
        DESC_REACTION_SNAPSHOT: "Listet die momentanen Reaktionen eines bestimmten Posts auf.",
        DESC_TS_GUILD_ADD: "Erstellt eine neue Gilde auf dem TeamSpeak-Server.",
        DESC_TS_GUILD_DELETE: "Lösche eine Gilde vom TeamSpeak-Server",
        DESC_FIND_UNREGISTERED: "Findet en Spieler, der e Serverrolle het, aber net in der Datebank zu finde isch.",
        DESC_PERMISSION_ADD: "Vergibt oder entzieht einer Rolle oder einem Benutzer oder einer Rolle Berechtigungen für Befehle.",
        DESC_PERMISSION_LIST: "Listet all gsezte Bereschtigunge uf.",
        DESC_PERMISSION_REMOVE: "Löscht die Berechtigung mit ihrer Id.",
        DESC_GUILD_CHAN: "Werte hängen von Server Startzeit ab und könnten deshalb falsch sein",
        DESC_GUILD_CHANNEL_LIST: "Listet Gildenkanäle und deren Aktivität im TS",

        MK_GUILD_CONFIRM: "Deine Anfrage:\n**Name:** {0}\n**Kontakt:** {1}\n**TS-Gruppe:** {2}\nBasst des so?",
        MK_GUILD_CONFIRM_NO_GROUP: "Deine Anfrage:\n**Name:** {0}\n**Kontakt:** {1}\nBasst des so?",
        MK_GUILD_TIMEOUT: "Des hat mer zlang gedauert. Probiersch halt no amol.",
        MK_GUILD_CANCELED: "Okay, lassmers halt.",
        MK_GUILD_COMPLETE: "I han des jetzt amol an de TS gschickt.",
        MK_GUILD_UNKNOWN_GUILD:
            "Es gibt keine Gilde namens '{0}' im Spiel. Stell bitte sicher, dass du dich nicht verschrieben hast und achte auf korrekte Groß-/ Kleinschreibung.",

        RM_GUILD_COMPLETE: "I frag amol de TS.",

        COOLDOWN_GO_FISH: "Du bisch noch viel zum entspannt. Jetzt wartsch halt emol noch {0} Sekunde(n). :relieved:",

        COMMANDER_TAG_UP: "Kommandör **{0}** ({1}) fangt grad en Raid im TeamSpeak an!",
        COMMANDER_TAG_UP_TEAMSPEAK_LINK_TEXT: "Uffen TeamSpeak gange",
        COMMANDER_TAG_UP_TEAMSPEAK_LINK_ALT: "Wenn'd TeamSpeak 3 installiert hesch, kannsch über selle Link em Kommandör beitrete.",

        RED_BORDERLANDS: "Rote Grenz",
        BLUE_BORDERLANDS: "Blaue Grenz",
        GREEN_BORDERLANDS: "Grüne Grenz",
        ETERNAL_BATTLEGROUNDS: "Ewige",
        RESETLEAD_HEADER:
            "Drücksch auf des passende Emote, damitd en Kommandeur für de Reset wirsch. Um dich auszumtrage drücksch grad aufs ❌. Wennd willsch, dass mer unsre Gegner bscheid sage, wod nagehsch, drücksch aufs 📣.",
        ROSTER_EXISTS: "Da hemmer scho en Roster: {0}",
        WEEK_NUMBER: "Kalenderwoche",
        ROSTER_LEAD_ADDED: "I han de `{0}` erfolgreich als Kommandeur fürd Kadde `{1}` in Woche {2} neigsetzt. Siehe {3}",
        ROSTER_LEAD_REMOVED: "`{0}` wurde erfolgreich als Kommandeur in Woche {1} entfernt. Siehe {2}",
        ROSTER_LEAD_VISIBILITY_TOGGLED: "`{0}`s Sichtbarkeit in Woche {1} han ich geändert. Siehe {2}",

        MK_EVENT_DATE: "Gib als nächstes ein gültiges Datum mit Uhrzeit an. Z.B. `15.02.2022 16:33`",
        MK_EVENT_TITLE: "Gib jetzt einen Titel für das Event an.",
        MK_EVENT_DESC: "Gib nun eine kurze Beschreibung für das Event an.",
        MK_EVENT_REMINDER:
            "Falls automatisch eine Erinnerung gepostet werden soll, gib jetzt an, wie viele Minuten vor dem Event das geschehen soll. Gib eine negative Zahl an, falls du keine Erinnerung möchtest.",
        MK_EVENT_TIMEOUT:
            "Das Zeitlimit für die Eingabe wurde überschritten und die Event-Erstellung abgebrochen. Du kannst den Prozess erneut starten.",

        FISHING_IDLE_TITLE: "Angeln",
        FISHING_IDLE_DESCRIPTION:
            "Jetzt machsch ma halblang. Aber pass auf dei Angel auf! Wenn :fishing_pole_and_fish: kommt musch da zügig draufklicke!",

        FISHING_ESCAPED_TITLE: "Entwischt",
        FISHING_ESCAPED_DESCRIPTION: "Net so viel entspanne, du Grasdackel! Jetz ischer halt fort!",

        FISHING_CAUGHT_TITLE: "Gefangen",
        FISHING_CAUGHT_DESCRIPTION: "Du hasch ebs gfange!",
    },
};

type Options = {
    [option: string]: boolean;
};

class Language {
    public readonly abbreviation: string;
    public readonly flag: string;
    public readonly strings: { [key: string]: string };

    public constructor(abbreviation: string, flag: string, strings: { [key: string]: string }) {
        this.abbreviation = abbreviation;
        this.flag = flag;
        this.strings = strings;
    }

    public get(key: string, args: string[] = [], options: Options = {}): string {
        let str: string = key in this.strings ? this.strings[key].formatUnicorn(args) : key;
        if ("italic" in options && options["italic"]) {
            str = `_${str}_`;
        }
        if ("bold" in options && options["bold"]) {
            str = `**${str}**`;
        }
        // checking flags must be the final addition!
        if ("flags" in options && options["flags"]) {
            str = `${this.flag} ${str}`;
        }
        return str;
    }
}

export const german = new Language("DE", ":flag_de:", DE);
export const english = new Language("EN", ":flag_gb:", EN);
export const swabian = new Language("DE_SWG", "<:flag_de_swg:826915488658751519>", DE_SWG); // ":black_large_square::yellow_square:"

export const availableLanguages = [german, english, swabian];
const currentLanguages: Language[] = [];

/**
 * Sets the used locale to the passed languages. Unknown languages will be skipped.
 *
 * @param abbreviations - a list of abbreviations for the languages to use. E.g. ["DE", "EN"] uses German and English (in that order).
 *                        Available abbreviations can be retrieved from the exported constant availableLanguages.
 */
export function setLanguages(abbreviations: string[]) {
    currentLanguages.length = 0; // wouldn't you know it, this is actually the way to empty an array in JS...
    for (const abbreviation of abbreviations) {
        const language = availableLanguages.find((l) => l.abbreviation === abbreviation);
        if (language === undefined) {
            logger.warn(`Skipping unknown language ${language}`);
        } else {
            currentLanguages.push(language);
        }
    }
    logger.info(`Locales are now set to ${currentLanguages.map((l) => l.abbreviation)}.`);
}

/**
 * Tries to resolve the passed key into a locale string.
 *
 * @param key - the key to get the locale string for
 * @param args - optional, the arguments that are to be formatted into the resolved string
 * @returns if a locale string could be found, that string with the passed arguments inserted into it, if it contains placeholders.
 *          If no locale string could be found, the key is returned instead.
 */
export function get(key: string, args?: string[], separator = "\n\n", flags = true, options: Options = {}): string {
    options.flags = flags; // flags was a separate parameter for historical reasons. Monkey-patching this into a proper option-dictionary now~
    return currentLanguages.map((l) => l.get(key, args, options)).join(separator);
}

export function getIn(locale: discord.Locale, key: string, args?: string[], options: Options = {}): string {
    options.flags = false;
    switch (locale) {
        case discord.Locale.German:
            return german.get(key, args, options);
        default:
            return english.get(key, args, options);
    }
}
