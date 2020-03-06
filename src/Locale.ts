//import { WvWMap } from "./commands/resetlead/ResetLead";

export let EN : Object = {
    "HELPTEXT_PREFIX": "Please use the command with the following parameters:\n"
};

EN = {
    ...EN,
    ...{
        "INTERNAL_ERROR": "An internal error occured. Please contact an administrator about this.",

        "NOT_PERMITTED": "You do not have the required permissions to execute this command.",
        "PERMISSION_SET_TO": "Permission for `{0}` for command `{1}` set to **{2}**.",
        "WELCOME": "Welcome to the Riverside-Discord. :)\n Much of this server isn't accessible to for guests. Please authenticate using an API-key:\n\n1. Visit https://account.arena.net/applications\n2. Click 'new key'\n3. Post `,auth` followed by your new key per direct message (this window) to me.\n\nEg: `,auth 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111`.",
        "NO_SUCH_COMMAND": "I don't know the command '{0}' you gave me.",
        "NOT_AVAILABLE_AS_DM": "This command is not usable as direct message. Please try it again within a server.",
        "NOT_CRONABLE": "This command can not be used in a cronjob.",
        "NO_DEL_PERM": "I could not delete your last message. Please remove it yourself for security reasons.",
        "KEY_INVALID_FORMAT": "Please give me a valid API-key. You can acquire one at https://account.arena.net/.",
        "KEY_ACCEPTED": "Welcome, friend! Please read up on the information in INFOCENTER, to use this Discord properly. :)",
        "KEY_DECLINED": "The account you gave me is not situated on a valid server or the API-key is invalid.",
        "KEY_NOT_UNIQUE": "The API-key you gave me is already in use. Please generate a new key.\nRemove the old key at https://account.arena.net/, if you don't know about it being used.",
        "KEY_INVALIDATED": "Hi!\nThe API-key you gave me is no longer considered valid.\nI thereby remove your access for the internal channels. You can re-register any time with a valid API-key.",
        "CHECKING_KEY": "Checking API-key...",
        "REG_ROLE_NOT_FOUND": "The assigned role does not exist. Please inform an administrator about this.",
        "PRUNING_COMPLETE": "API-keys are now beeing re-validated. This can take a while.",
        "FIND_DUPLICATES_COMPLETE": "Duplicate search complete.",
        "GUILD_LOG_COMPLETE": "Guild log has successfully be retrieved.",
        "PERMANENT_ROLE_ADD_SUCC": "Permanent role has successfully been added.",
        "PERMANENT_ROLE_ADD_FAIL": "Permanent role could not be added. Maybe the role is already permanent for that user.",
        "PERMANENT_ROLE_RM_SUCC": "Permanent role was successfully removed.",
        "PERMANENT_ROLE_RM_FAIL": "Permanent role could not be removed.",
        "WHOIS_EMPTY_RESULT": "No results found.",
        "WHOIS_RESULTS": "The following possible results were found:",
        "DLOG_AUTH": "User {0} with ingame account `{1}` has been authorised with role {2}.",
        "DLOG_UNAUTH": "User {0} with ingame account `{1}` has been de-authorised and lost their role {2}.",
        "AWARD_ACHIEVEMENT_SUCCESS_FIRST_TIME": "Achievement successfully awarded for the first time.",
        "AWARD_ACHIEVEMENT_SUCCESS_AGAIN": "Achievement successfully awarded again.",
        "AWARD_ACHIEVEMENT_FAILED_NOT_AWARDED": "Could not award this achievement to that user. The achievement is probably not repeatable and already awarded to that player.",
        "AWARD_ACHIEVEMENT_FAILED_USER_NOT_FOUND": "No GW2 account found to award them this achievement.",
        "AWARD_ACHIEVEMENT_FAILED_USER_HIDDEN": "That user has chosen to hide their achievements.",
        "NO_SUCH_ACHIEVEMENT": "There is achievement with that name.",
        "REVOKE_ACHIEVEMENT_SUCCESS": "{0} achievement(s) revoked.",
        "REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND": "No GW2 account found to revoke this achievement from.",

        "CRONJOB_STORED": "Your cronjob has been saved with ID {0}. Next execution: {1}.",
        "CRONJOB_NOT_STORED": "Your cronjob could not be created. Either the command is not available for crons, or the time you gave me is invalid. Please check https://crontab.guru/ in the latter case.",
        "CRONJOB_DELETED": "The cronjob has been deleted.",
        "CRONJOB_NOT_DELETED": "The cronjob could not be deleted.",
        
        "FAQ_STORED": "The FAQ entry has been created.",
        "FAQ_NOT_STORED": "The FAQ-entry could not be created.",
        "FAQ_DELETED": "The FAQ entry for '{0}' has been deleted.",
        "FAQ_NOT_DELETED": "The FAQ entry for '{0}' could not be deleted.",
        "FAQ_NOT_FOUND": "There is no FAQ-entry for the keyword '{0}'.",
        "CIRCULAR_CRON": "Cronjobs can not be recursive for security reasons.",
        "TS_UNREGISTER_SENT": "Successfully sent request to remove TS registration.",

        "GUILD_LOG_PERMISSION_FAIL": "I need the API-key of a guild leader to retrieve the guild log.",

        "HELPTEXT_PERMIT": EN["HELPTEXT_PREFIX"] + "`\"<name or alias of a command>\" \"<snowflake or name of the player or role (MUST EXIST)>\" <numerical permission value, positive to allow, negative to disallow>`",
        "HELPTEXT_SAY": EN["HELPTEXT_PREFIX"] + "`<Channel, in which the bot should speak> \"<Text to speak>\"`.",
        "HELPTEXT_MAKE_CRON": EN["HELPTEXT_PREFIX"] + "\"`<Cron-Scheduling-String (UNIX-Format)>`\" \"`<Command to execute>`\" `<Parameters for that command as specified by the help text>`.",
        "HELPTEXT_DELETE_CRON": EN["HELPTEXT_PREFIX"] + "`<ID of the cronjob to delete>`\nIDs of all cronjobs can be found with the `lscrons`-command.",
        "HELPTEXT_POLL": EN["HELPTEXT_PREFIX"] + "`<Channel to create the poll in> \"<Question for the poll>\" \"<Emotes available for voting>\"`.",
        "HELPTEXT_MAKE_FAQ": EN["HELPTEXT_PREFIX"] + "`\"<Keywords to link to the entry, separated with semicolons (;)>` `\"<FAQ text>\"`.",
        "HELPTEXT_GET_FAQ": EN["HELPTEXT_PREFIX"] + "`<Keyword>`",
        "HELPTEXT_DELETE_FAQ": EN["HELPTEXT_PREFIX"] + "`<Keyword>`",
        "HELPTEXT_PIPE_GUILD_LOG": EN["HELPTEXT_PREFIX"] + "\"`<Name of the guild>`\" `<API-key of the leader>` `<Channel to pipe the log to>`",
        "HELPTEXT_ADD_PERMANENT_ROLE": EN["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        "HELPTEXT_REMOVE_PERMANENT_ROLE": EN["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        "HELPTEXT_WHOIS": EN["HELPTEXT_PREFIX"] + "`<part of an account- or discord-name (at least three characters!)>`",
        "HELPTEXT_DISCORD_LOG": EN["HELPTEXT_PREFIX"] + "`<arbitary event type>` `<text channel to which messages of EN type should be directed>`",
        "HELPTEXT_PRUNE": EN["HELPTEXT_PREFIX"] + "`<number of days to be considered inactive (1 <= n <= 30)>` `<text the pruned members should receive as private message>`",
        "HELPTEXT_RESET_ROSTER": EN["HELPTEXT_PREFIX"] + "`<Channel, in which the post should be created>` (`<number of week for the roster, default: current week>`) (`year for the roster, default: current year`)",
        "HELPTEXT_ADD_RESET_LEADER": EN["HELPTEXT_PREFIX"] + "`<player to add (any text)>` `<{0}>` `<week number (optional)>` `<year (optional)>`",
        "HELPTEXT_REMOVE_RESET_LEADER": EN["HELPTEXT_PREFIX"] + "`<player to add (any text)>` `<week number (optional)>` `<year (optional)>`",
        "HELPTEXT_SET_TS3_RESET_ROSTER": "",
        "HELPTEXT_AWARD_ACHIEVEMENT": EN["HELPTEXT_PREFIX"] + "`<achievement name>` `<player name>` `<timestamp dd.mm.yyyy hh:mm (optional, default: now)>`",
        "HELPTEXT_REVOKE_ACHIEVEMENT": EN["HELPTEXT_PREFIX"] + "`<achievement name or achievement DB id>` (`<Discord user to revoke from, iff an achievement name was given>`)",
        "HELPTEXT_LIST_ACHIEVEMENTS": EN["HELPTEXT_PREFIX"] + "",
        "HELPTEXT_DELETE_TS_REGISTRATION": EN["HELPTEXT_PREFIX"] + "`<GW2 account name>`",

        "DESC_PERMIT": "Grants or revokes permissions for a role or user to use a command.",
        "DESC_DELETE_CRON": "Deletes the cronjob with the given ID.",
        "DESC_LIST_CRONS": "Lists all cronjobs.",
        "DESC_MAKE_CRON": "Creates a new cronjob for the given timestamp.",
        "DESC_AUTHENTICATE": "Authenticates the user with a GW2-API-key.",
        "DESC_POLL": "Creates a poll with preselected emotes for voting.",
        "DESC_REAUTHENTICATE": "Re-authenticates all GW2-API-keys again.",
        "DESC_SAY": "Speaks the given text in a channel.",
        "DESC_HELP": "This command. Lists all available commands with a short description.",
        "DESC_TS_SYNC": "Syncs all roles with the TS3-Server (_INACTIVE_).",
        "DESC_MAKE_FAQ": "Adds a new FAQ entry.",
        "DESC_DELETE_FAQ": "Removes an entry from the FAQ.",
        "DESC_GET_FAQ": "Gives the FAQ entry to a keyword.",
        "DESC_LIST_FAQS": "Lists all FAQ entries.",
        "DESC_FIND_DUPLICATES": "Finds all Discord users sharing one GW2 account..",
        "DESC_PIPE_GUILD_LOG": "Pipes the guild log of a guild to a Discord channel.",
        "DESC_REPAIR_ROLES": "Gives all users the role they have been assigned as per the database.",
        "DESC_ADD_PERMANENT_ROLE": "Permanently gives a user a role he will be assigned even if he rejoins the server.",
        "DESC_REMOVE_PERMANENT_ROLE": "Removes a permanent role from a user, so that they won't have it assigned again upon rejoining the server.",
        "DESC_WHOIS": "Looks up the pair of Discord name and ingame name.",
        "DESC_DISCORD_LOG": "Sets up the connection between an event-type and a Discord-text-channel.",
        "DESC_PRUNE": "Prunes inactive users without roles.",
        "DESC_RESET_ROSTER": "Creates a post for commanders to roster.",
        "DESC_ADD_RESET_LEADER": "Manually adds a player as reset lead.",
        "DESC_REMOVE_RESET_LEADER": "Manually removes a player as reset lead.",
        "DESC_SET_TS3_RESET_ROSTER": "Syncs the current reset roster to TS3.",
        "DESC_ADD_EVENT": "Creates a new event.",
        "DESC_AWARD_ACHIEVEMENT": "Grants a player an achievement.",
        "DESC_REVOKE_ACHIEVEMENT": "Revokes all instances of an achievement from a player or deletes a particular achievement entry.",
        "DESC_LIST_ACHIEVEMENTS": "Lists all achievable achievements.",
        "DESC_DELETE_TS_REGISTRATION": "Deletes all TS registrations from a GW2 account.",

        "COMMANDER_TAG_UP": "{0} tagged up in Teamspeak-channel '{1}'! {2}",

        "RED_BORDERLANDS": "Red Borderlands",
        "BLUE_BORDERLANDS": "Blue Borderlands",
        "GREEN_BORDERLANDS": "Green Borderlands",
        "ETERNAL_BATTLEGROUNDS": "Eternal Battlegrounds",
        "RESETLEAD_HEADER": "React with one of these emotes to set yourself as reset lead. React with ❌ to withdraw your lead.",
        "ROSTER_EXISTS": "There is already a roster for that week: {0}",
        "WEEK_NUMBER": "Week Number",
        "ROSTER_LEAD_ADDED": "Player `{0}` has successfully been added as reset lead for the map `{1}` on week {2}. See {3}",
        "ROSTER_LEAD_REMOVED": "Player `{0}` has successfully been removed as reset lead for week {1}. See {2}",

        "MK_EVENT_DATE": "Enter a valid date with time next. E.g. `15.02.2022 16:33`",
        "MK_EVENT_TITLE": "Enter a title for the event now.",
        "MK_EVENT_DESC": "Enter a short description for the event.",
        "MK_EVENT_REMINDER": "If you want to have an automatic reminder posted for your event, enter how many minutes before the event the reminder should be posted. If you do not want to have reminder, enter a negative number instead.",
        "MK_EVENT_TIMEOUT": "The time for input ran out and event creation was canceled. You can start over the event creation.",

        "ACHIEVEMENT_UNLOCKED": "Achievement unlocked",

        "ACHIEVEMENT_NAME_GLIMMER": "Glimmer",
        "ACHIEVEMENT_DESC_GLIMMER": "Tag up for an hour.",
        "ACHIEVEMENT_FLAV_GLIMMER": "Welcome to the bridge, commander!",

        "ACHIEVEMENT_NAME_SUNRAY": "Sunray",
        "ACHIEVEMENT_DESC_SUNRAY": "Tag up for ten hours.",
        "ACHIEVEMENT_FLAV_SUNRAY": "Welcome back, commander!",

        "ACHIEVEMENT_NAME_BLAZINGLIGHT": "Blazing Light",
        "ACHIEVEMENT_DESC_BLAZINGLIGHT": "Tag up for one hundred hours.",
        "ACHIEVEMENT_FLAV_BLAZINGLIGHT": "The troops are counting on you.",

        "ACHIEVEMENT_NAME_SUPERNOVA": "Supernova",
        "ACHIEVEMENT_DESC_SUPERNOVA": "Tag up for one thousand hours.",
        "ACHIEVEMENT_FLAV_SUPERNOVA": "Hosts abide your arrival.",

        "ACHIEVEMENT_NAME_TRAILBLAZER": "Trailblazer",
        "ACHIEVEMENT_DESC_TRAILBLAZER": "Tag up during a reset. For this to count, you need to tag up at before the reset takes place and lead for at least two hours from then.",
        "ACHIEVEMENT_FLAV_TRAILBLAZER": "You are the calm before the storm.",

        "ACHIEVEMENT_NAME_OWL": "Owl",
        "ACHIEVEMENT_DESC_OWL": "Tag up during the night. For this to count, you need to tag up between 11 PM and 6 AM for at least one hour.",
        "ACHIEVEMENT_FLAV_OWL": "Who zergs there so late through the night dark and drear? It is the commander, he soweth the fear.",

        "ACHIEVEMENT_NAME_EARLYBIRD": "Early Bird",
        "ACHIEVEMENT_DESC_EARLYBIRD": "Tag up in the morning. For this to count, you need to tag up between 6 AM and 10 AM for at least one hour.",
        "ACHIEVEMENT_FLAV_EARLYBIRD": "I love the smell of Sand Shades in the morning!",

        "ACHIEVEMENT_NAME_ANNIHILATOR": "Annihilator",
        "ACHIEVEMENT_DESC_ANNIHILATOR": "Tag up while the server has a total KDR of 2.",
        "ACHIEVEMENT_FLAV_ANNIHILATOR": "Colour the ground with their blood.",

        "ACHIEVEMENT_NAME_NEVERSURRENDER": "Never Surrender!",
        "ACHIEVEMENT_DESC_NEVERSURRENDER": "Tag up when the server has a KD of 0.6 or less.",
        "ACHIEVEMENT_FLAV_NEVERSURRENDER": "They may take our lives, but they will never take our freedom!",

        "ACHIEVEMENT_NAME_CONQUEROR": "Conqueror",
        "ACHIEVEMENT_DESC_CONQUEROR": "The server reaches a tick of at least 250 during your raid.",
        "ACHIEVEMENT_FLAV_CONQUEROR": "Colour the map with our colours.",

        "ACHIEVEMENT_NAME_UNCHALLENGEDSOVEREIGN": "Unchallenged Sovereign",
        "ACHIEVEMENT_DESC_UNCHALLENGEDSOVEREIGN": "Stonemist Castle did not fall during your raid. For this to count, Stonemist Castle needs to be under our control for at least an hour during your raid.",
        "ACHIEVEMENT_FLAV_UNCHALLENGEDSOVEREIGN": "It is good to be the king.",

        "ACHIEVEMENT_NAME_AGILEDEFENDER": "Agile Defender",
        "ACHIEVEMENT_DESC_AGILEDEFENDER": "None of our objectives with tier 3 fell during your raid. This achievement is only awarded if your raid started during prime time (somewhere between 6 PM and 9 PM), went on for one hour or more, and at least three of our objectives were of tier 3 at the start of your raid.",
        "ACHIEVEMENT_FLAV_AGILEDEFENDER": "When you call, we will come.",

        "ACHIEVEMENT_NAME_THOROUGHCOMMANDER": "Thorough Commander",
        "ACHIEVEMENT_DESC_THOROUGHCOMMANDER": "All objectives on a map belong to us during your raid. This only includes camps, towers, keeps, and Stone Mist castle.",
        "ACHIEVEMENT_FLAV_THOROUGHCOMMANDER": "Everything the light touches is our kingdom.",

        "ACHIEVEMENT_NAME_BOLDBESIEGER": "Bold Besieger",
        "ACHIEVEMENT_DESC_BOLDBESIEGER": "Crash ten tier 3 objectives during your raids.",
        "ACHIEVEMENT_FLAV_BOLDBESIEGER": "Wasn't that ours a moment ago?!",

        "ACHIEVEMENT_NAME_TENACIOUSBESIEGER": "Tenacious Besieger",
        "ACHIEVEMENT_DESC_TENACIOUSBESIEGER": "Crash 100 tier 3 objectives during your raids.",
        "ACHIEVEMENT_FLAV_TENACIOUSBESIEGER": "We have taken the bridge and the Second Hall. They have barred the gates but cannot hold them for long. The ground shakes.",

        "ACHIEVEMENT_NAME_PRINCESS": "Princess",
        "ACHIEVEMENT_DESC_PRINCESS": "Capture Osprey's Palace during your raid.",
        "ACHIEVEMENT_FLAV_PRINCESS": "\"I am a princess!\" -- anonymous",

        "ACHIEVEMENT_NAME_CASTLING": "Castling",
        "ACHIEVEMENT_DESC_CASTLING": "Take a more valuable objective from another faction while they are taking one of our objectives.",
        "ACHIEVEMENT_FLAV_CASTLING": "A fair trade.",

        "ACHIEVEMENT_NAME_ETTIN": "Ettin",
        "ACHIEVEMENT_DESC_ETTIN": "Have a raid simultaneously with another commander. Only commanders that are leading for at least one hour are counted.",
        "ACHIEVEMENT_FLAV_ETTIN": "Divide et impera.",

        "ACHIEVEMENT_NAME_HYDRA": "Hydra",
        "ACHIEVEMENT_DESC_HYDRA": "Have a raid simultaneously with at least two other commanders. Only commanders that are leading for at least one hour are counted.",
        "ACHIEVEMENT_FLAV_HYDRA": "Cut off one head, two more will take its place.",

        "ACHIEVEMENT_NAME_SHIFTCHANGE": "Shift Change",
        "ACHIEVEMENT_DESC_SHIFTCHANGE": "Take over the raid from another commander. For this to count you need to tag up in the same channel as another commander or at most five minutes after they tagged down. Lead the raid for at least one hour after that.",
        "ACHIEVEMENT_FLAV_SHIFTCHANGE": "I am so glad to see you.",

        "ACHIEVEMENT_NAME_BULLETPROOF": "Bullet Proof",
        "ACHIEVEMENT_DESC_BULLETPROOF": "Raid while the matchup can not be won anymore. This achievement is only awarded if our ranking withtin the ongoing match can not change anymore.",
        "ACHIEVEMENT_FLAV_BULLETPROOF": "Behind this commander's tag there is more than just a player. Beneath this commander's tag there is an idea... and ideas are indestructible.",

        "ACHIEVEMENT_NAME_BOOZECOMMANDER": "Booze Commander",
        "ACHIEVEMENT_DESC_BOOZECOMMANDER": "Do a booze raid.",
        "ACHIEVEMENT_FLAV_BOOZECOMMANDER": "That's unfair! They have suddenly doubled in numbers!",

        "ACHIEVEMENT_NAME_FROMASHES": "From the Ashes",
        "ACHIEVEMENT_DESC_FROMASHES": "Aid in raising the server from tier 4.",
        "ACHIEVEMENT_FLAV_FROMASHES": "They have taken everything from us. Even fear itself.",

        "ACHIEVEMENT_NAME_MOUNTAINISCALLING": "The Mountain is Calling",
        "ACHIEVEMENT_DESC_MOUNTAINISCALLING": "Aid in raising the server from tier 3.",
        "ACHIEVEMENT_FLAV_MOUNTAINISCALLING": "Rasta from Jamaica in Bavarian exile",

        "ACHIEVEMENT_NAME_THEPEAK": "The Peak",
        "ACHIEVEMENT_DESC_THEPEAK": "Aid in raising the server from tier 2.",
        "ACHIEVEMENT_FLAV_THEPEAK": "The best view.",

        "ACHIEVEMENT_NAME_TIERSOLIDIFIER": "Tier Solidifier",
        "ACHIEVEMENT_DESC_TIERSOLIDIFIER": "Aid in keeping the server in the current tier.",
        "ACHIEVEMENT_FLAV_TIERSOLIDIFIER": "Nice tier. I'll take it.",

        "ACHIEVEMENT_NAME_STAMINACOMMANDER": "Sustained Commander",
        "ACHIEVEMENT_DESC_STAMINACOMMANDER": "Lead for five hours straight.",
        "ACHIEVEMENT_FLAV_STAMINACOMMANDER": "Probably fell asleep on their keyboard.",

        "ACHIEVEMENT_NAME_INFINITESTAMINA": "Infinite Stamina",
        "ACHIEVEMENT_DESC_INFINITESTAMINA": "Lead for ten hours straight.",
        "ACHIEVEMENT_FLAV_INFINITESTAMINA": "It's easy. Just brew your coffee with Red Bull.",        
    }
};

export let DE : Object = {
    "HELPTEXT_PREFIX": "Bitte benutze den Befehle mit folgenden Parametern:\n"
};

DE = {
    ...DE,
    ...{
        "INTERNAL_ERROR": "Ein interner Fehler ist aufgetreten. Bitte benachrichtige einen Administrator, damit dieser sich des Problems annehmen kann.",

        "NOT_PERMITTED": "Du hast nicht die nötigen Berechtigungen um diesen Befehl auszuführen.",
        "PERMISSION_SET_TO": "Berechtigung für `{0}` auf Befehl `{1}` ist jetzt **{2}**.",
        "WELCOME": "Herzlich willkommen auf dem Flussufer-Discord! :)\nEin Großteil des Servers ist für Gäste nicht zugänglich. Bitte authentifiziere dich mittels eines API-Keys:\n\n1. Besuche dazu https://account.arena.net/applications\n2. Klicke auf \"Neuer Schlüssel\"\n3. Poste `,auth ` gefolgt von deinem neuen Schlüssel per Direktnachricht (dieses Fenster) an mich.\n\nZ.B: `,auth 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111`.",
        "NO_SUCH_COMMAND": "Den von dir angegebenen Befehl '{0}' kenne ich nicht.",
        "NOT_AVAILABLE_AS_DM": "Dieser Befehl ist per Privatnachricht nicht nutzbar. Bitte versuche es auf einem Server erneut.",
        "NOT_CRONABLE": "Dieser Befehl kann nicht als Teil eines Cronjobs verwendet werden.",
        "NO_DEL_PERM": "Ich kann leider keine Nachrichten löschen. Bitte entferne aus Sicherheitsgründen deine letzte Nachricht manuell.",
        "KEY_INVALID_FORMAT": "Bitte gib mir einen gültigen API-Key. Diesen erhältst du auf https://account.arena.net/.",
        "KEY_ACCEPTED": "Herzlich willkommen, Flussufler! Bitte lies dir die Informationen im INFOCENTER durch, um Discord im vollen Maße nutzen zu können. :)",
        "KEY_DECLINED": "Der von dir angegebene Account ist derzeit nicht auf Flussufer angesiedelt oder ist kein gültiger API-Key.",
        "KEY_NOT_UNIQUE": "Der von dir angegebene API-Key ist leider schon in Benutzung. Bitte generiere einen neuen Key.\nEntferne den alten Key auf https://account.arena.net/, falls dir dessen Nutzung nicht bekannt ist.",
        "KEY_INVALIDATED": "Hallo!\nDer von dir angegebene API-Key ist nicht mehr auf Flussufer angesiedelt.\nDaher müssen wir dir leider die Zugangsrechte für den privaten Bereich entziehen. Du kannst dich gerne jederzeit mit einem neuen API-Key authentifizieren.",
        "CHECKING_KEY": "Prüfe API-Key...",
        "REG_ROLE_NOT_FOUND": "Die eingestellte Rolle existiert nicht auf dem Server. Bitte informiere einen Administrator.",
        "PRUNING_COMPLETE": "API-Keys werden nun re-validiert. Das kann eine Weile dauern.",
        "FIND_DUPLICATES_COMPLETE": "Duplikatsuche abgeschlossen.",
        "GUILD_LOG_COMPLETE": "Gilden-Logbuch erfolgreich abgerufen.",
        "PERMANENT_ROLE_ADD_SUCC": "Die permanente Rolle wurde erfolgreich hinzugefügt.",
        "PERMANENT_ROLE_ADD_FAIL": "Die permanente Rolle konnte nicht hinzugefügt werden. Möglicherweise ist diese Rolle bereits permanent dem Benutzer zugewiesen.",
        "PERMANENT_ROLE_RM_SUCC": "Die permanente Rolle wurde erfolgreich entfernt.",
        "PERMANENT_ROLE_RM_FAIL": "Die permanente Rolle konnte nicht entfernt werden.",
        "WHOIS_EMPTY_RESULT": "Keine Treffer gefunden.",
        "WHOIS_RESULTS": "Die folgenden möglichen Treffer wurden gefunden:",
        "DLOG_AUTH": "Benutzer {0} mit dem Ingame-Account `{1}` wurde mit der Rolle {2} autorisiert.",
        "DLOG_UNAUTH": "Benutzer {0} mit dem Ingame-Account `{1}` wurde ent-autorisiert und hat die Rolle {2} verloren.",
        "AWARD_ACHIEVEMENT_SUCCESS_FIRST_TIME": "Errungenschaft wurde erfolgreich zum ersten mal gewährt.",
        "AWARD_ACHIEVEMENT_SUCCESS_AGAIN": "Errungenschaft wurde erfolgreich erneut gewährt.",
        "AWARD_ACHIEVEMENT_FAILED_NOT_AWARDED": "Diese Errungenschaft konnte dem Benutzer nicht gewährt werden. Wahrscheinlich ist die Errungenschaft nicht wiederholbar und wurde dem Spieler bereits gewährt.",
        "AWARD_ACHIEVEMENT_FAILED_USER_NOT_FOUND": "Es wurde kein zugehöriger GW2-Account gefunden, dem die Errungenschaft gewährt werden könnte.",
        "AWARD_ACHIEVEMENT_FAILED_USER_HIDDEN": "Dieser Benutzer lässt seine Errungenschaften nicht anzeigen.",
        "NO_SUCH_ACHIEVEMENT": "Es gibt keine Errungenschaft dieses Namens.",
        "REVOKE_ACHIEVEMENT_SUCCESS": "{0} Errungenschaft(en) entzogen.",
        "REVOKE_ACHIEVEMENT_FAILED_USER_NOT_FOUND": "Es wurde kein zugehöriger GW2-Account gefunden, dem die Errungenschaft entzogen werden könnte.",

        "CRONJOB_STORED": "Dein Cronjob wurde gespeichert mit der ID {0}. Nächste Ausführung: {1}.",
        "CRONJOB_NOT_STORED": "Dein Cronjob konnte nicht erstellt werden. Entweder, der Befehl ist für Cronjobs nicht verfügbar oder die von dir übergebene Zeitangabe ist ungültig. Du kannst diese auf https://crontab.guru/ überprüfen.",
        "CRONJOB_DELETED": "Der Cronjob wurde gelöscht.",
        "CRONJOB_NOT_DELETED": "Der Cronjob konnte nicht gelöscht werden.",
        
        "FAQ_STORED": "Der FAQ-Eintrag wurde erstellt.",
        "FAQ_NOT_STORED": "Der FAQ-Eintrag konnte nicht erstellt werden.",
        "FAQ_DELETED": "Der FAQ-Eintrag für '{0}' wurde gelöscht.",
        "FAQ_NOT_DELETED": "Der FAQ-Eintrag für '{0}' konnte nicht gelöscht werden.",
        "FAQ_NOT_FOUND": "Es gibt keinen FAQ-Eintrag zu dem Stichwort '{0}'.",
        "CIRCULAR_CRON": "Cronjobs dürfen aus Sicherheitsgründen selbst keine Cronjobs schedulen.",
        "TS_UNREGISTER_SENT": "Successfully sent request to remove TS registration.",

        "GUILD_LOG_PERMISSION_FAIL": "Für das Abrufen des Gilden-Logbuchs muss ein API-Key des Anführers hinterlegt sein.",

        "HELPTEXT_PERMIT": DE["HELPTEXT_PREFIX"] + "`<Name oder Alias des Befehls> <Name des Spielers oder der Rolle oder Snowflake (MUSS EXISTIEREN)> <numerischer Berechtigungs-Wert, positiv um zu erlauben, negativ um zu verbieten>`",
        "HELPTEXT_SAY": DE["HELPTEXT_PREFIX"] + "`<Channel, in dem der Bot sprechen soll> \"<Text, den der Bot abschicken soll>\"`.",
        "HELPTEXT_MAKE_CRON": DE["HELPTEXT_PREFIX"] + "`<Cron-Scheduling-String (UNIX-Format)>`\" \"`<Befehl, der gescheduled werden soll>`\" `<Parameter für den vorausgehenden Befehl, entsprechend dessen Hilfetext>`.",
        "HELPTEXT_DELETE_CRON": DE["HELPTEXT_PREFIX"] + "`<ID des Cronjobs, der gelöscht werden soll>`\nIDs aller Cronjobs kannst du mit dem `lscrons`-Befehl anzeigen lassen.",
        "HELPTEXT_POLL": DE["HELPTEXT_PREFIX"] + "`<Channel, in dem der Poll erstellt werden soll> \"<Frage, um die es im Poll geht>\" \"<Emotes, die zur Reaktion zur Verfügung stehen sollen>\"`.",
        "HELPTEXT_MAKE_FAQ": DE["HELPTEXT_PREFIX"] + "`\"<Schüsselwörter, die mit der Antwort verknüpft werden sollen. Werden am Semikolon (;) getrennt>` `\"<Text, der angezeigt werden sollen>\"`.",
        "HELPTEXT_GET_FAQ": DE["HELPTEXT_PREFIX"] + "`<Schüsselwort>`",
        "HELPTEXT_DELETE_FAQ": DE["HELPTEXT_PREFIX"] + "`<Schüsselwort>`",
        "HELPTEXT_PIPE_GUILD_LOG": DE["HELPTEXT_PREFIX"] + "\"`<Name der Gilde>`\" `<API Key des Anführers>` `<Channel, in dem der Log geschrieben werden soll>`",
        "HELPTEXT_ADD_PERMANENT_ROLE": DE["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        "HELPTEXT_REMOVE_PERMANENT_ROLE": DE["HELPTEXT_PREFIX"] + "`<@user>` `<@role>`",
        "HELPTEXT_WHOIS": DE["HELPTEXT_PREFIX"] + "`<Teilname des Accounts oder Discord-Namens (mindestens drei Buchstaben!)>`",
        "HELPTEXT_DISCORD_LOG": DE["HELPTEXT_PREFIX"] + "`<Eventtyp (beliebig)>` `<Textkanal, in den Nachrichten dieses Typs geleitet werden sollen>`",
        "HELPTEXT_PRUNE": DE["HELPTEXT_PREFIX"] + "`<Anzahl Offline-Tage bis ein Benutzer als inaktiv angesehen wird (1 <= n <= 30)>` `<Text, den entfernte Benutzer als Privatnachricht erhalten>`",
        "HELPTEXT_RESET_ROSTER": DE["HELPTEXT_PREFIX"] + "`<Channel, in dem der Post erstellt werden soll>` (`Kalenderwoche für den Reset, Standard: aktuelle Woche`) (`Jahr für den Reset, Standard: aktuelles Jahr`)",
        "HELPTEXT_ADD_RESET_LEADER": DE["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<{0}>` `<Kalenderwoche (optional)>` `<Jahr (optional)>`",
        "HELPTEXT_REMOVE_RESET_LEADER": DE["HELPTEXT_PREFIX"] + "`<Spielername (beliebiger Text)>` `<Kalenderwoche (optional)>`",
        "HELPTEXT_SET_TS3_RESET_ROSTER": "",
        "HELPTEXT_AWARD_ACHIEVEMENT": DE["HELPTEXT_PREFIX"] + "`<Name der Errungenschaft>` `<Spieler>` `<Zeitstempel dd.mm.yyyy hh:mm (optional, Standard: jetzt)>`",
        "HELPTEXT_REVOKE_ACHIEVEMENT": DE["HELPTEXT_PREFIX"] + "`<Name der Errungenschaft oder ID eines Spieler-Achievement-Datenbankeintrages>` (`<Discord-Benutzer von dem die Errungenschaft entfernt werden soll, wenn der Name einer Errungenschaft übergeben wurde>`)",
        "HELPTEXT_LIST_ACHIEVEMENTS": DE["HELPTEXT_PREFIX"] + "",
        "HELPTEXT_DELETE_TS_REGISTRATION": DE["HELPTEXT_PREFIX"] + "`<GW2 Accountname>`",

        "DESC_PERMIT": "Vergibt oder entzieht einer Rolle oder einem Benutzer oder einer Rolle Berechtigungen für Befehle.",
        "DESC_DELETE_CRON": "Löscht den Cronjob mit der angegebenen ID.",
        "DESC_LIST_CRONS": "Listet alle offenen Cronjobs auf.",
        "DESC_MAKE_CRON": "Erstellt einen neuen Cronjob auf den angegebenen Zeitpunkt.",
        "DESC_AUTHENTICATE": "Authentifiziert einen Benutzer mittels eines GW2-API-Keys.",
        "DESC_POLL": "Erstellt einen Poll mit vorgegebenen Emotes als Abstimmoptionen.",
        "DESC_REAUTHENTICATE": "Authentifiziert alle vorhandenen GW2-API-Keys erneut.",
        "DESC_SAY": "Spricht den übergebenen Text im übergebenen Channel.",
        "DESC_HELP": "Dieser Befehl. Listet alle verfügbaren Befehle mit einer kurzen Beschreibung auf.",
        "DESC_TS_SYNC": "Synchronisiert die Rollen mit dem Teamspeak3-Server (_NICHT AKTIV_).",
        "DESC_MAKE_FAQ": "Fügt den FAQ einen Eintrag hinzu.",
        "DESC_DELETE_FAQ": "Entfernt einen Eintrag von den FAQ.",
        "DESC_GET_FAQ": "Gibt die Antwort zu einem Stichwort der FAQ wieder.",
        "DESC_LIST_FAQS": "Listet alle vorhandenen FAQs auf.",
        "DESC_FIND_DUPLICATES": "Findet alle Discord-Benutzer, die sich einen GW2-Account teilen.",
        "DESC_PIPE_GUILD_LOG": "Schreibt den Guildlog einer Gilde in einen Discord-Channel.",
        "DESC_REPAIR_ROLES": "Gibt allen Benutzern die Rolle, die in der Datenbank für sie hinterlegt ist.",
        "DESC_ADD_PERMANENT_ROLE": "Fügt einem Benutzer permanent eine Rolle hinzu, die ihm beim erneuten Betreten des Servers automatisch wieder zugewiesen wird.",
        "DESC_REMOVE_PERMANENT_ROLE": "Löst eine permanente Rolle von einem Benutzer, sodass diese ihm beim Betreten des Servers nicht automatisch erneut zugewiesen wird.",
        "DESC_WHOIS": "Ermittelt ein Tupel aus Discord-Name and Ingame-Name.",
        "DESC_DISCORD_LOG": "Erstellt eine Verbindung zwischen einem Event-Typ und einem Discord-Text-Kanal.",
        "DESC_PRUNE": "Entfernt inaktive Benutzer ohne Rolle.",
        "DESC_RESET_ROSTER": "Erstellt einen Post, mithilfe dessen Kommandeure rostern können.",
        "DESC_ADD_RESET_LEADER": "Fügt manuell einen Spieler als Reset-Kommandeur hinzu.",
        "DESC_REMOVE_RESET_LEADER": "Entfernt manuell einen Spieler von den Reset-Kommandeuren.",
        "DESC_SET_TS3_RESET_ROSTER": "Syncronisiert das aktuelle Resetroster ins TS3.",
        "DESC_ADD_EVENT": "Erstellt ein neues Event",
        "DESC_AWARD_ACHIEVEMENT": "Vergibt eine Errungenschaft an einen Spieler.",
        "DESC_REVOKE_ACHIEVEMENT": "Entfernt alle Instanzen einer Errungenschaft von einem Spieler oder entfernt einenbestimmten Errungenschaften-Eintrag aus der Datenbank.",
        "DESC_LIST_ACHIEVEMENTS": "Listet alle verfügbaren Errungenschaften auf.",
        "DESC_DELETE_TS_REGISTRATION": "Löscht alle Registrierungen im TS anhand eines GW2 Accounts.",

        "COMMANDER_TAG_UP": "{0} hat im Teamspeak-Channel '{1}' einen Raid gestartet! {2}",

        "RED_BORDERLANDS": "Rote Grenzlande",
        "BLUE_BORDERLANDS": "Blaue Grenzlande",
        "GREEN_BORDERLANDS": "Grüne Grenzlande",
        "ETERNAL_BATTLEGROUNDS": "Ewige Schlachtfelder",
        "RESETLEAD_HEADER": "Reagiere mit einem der Emotes, um dich als Reset-Kommandeur einzutragen. Reagiere mit ❌ um dich wieder auszutragen.",
        "ROSTER_EXISTS": "Es gibt bereits ein Roster für diese Woche: {0}",
        "WEEK_NUMBER": "Kalenderwoche",
        "ROSTER_LEAD_ADDED": "Spieler `{0}` wurde erfolgreich als Kommandeur für die Karte `{1}` in der Woche {2} hinzugefügt. Siehe {3}",
        "ROSTER_LEAD_REMOVED": "Spieler `{0}` wurde erfolgreich als Kommandeur in der Woche {1} entfernt. Siehe {2}",

        "MK_EVENT_DATE": "Gib als nächstes ein gültiges Datum mit Uhrzeit an. Z.B. `15.02.2022 16:33`",
        "MK_EVENT_TITLE": "Gib jetzt einen Titel für das Event an.",
        "MK_EVENT_DESC": "Gib nun eine kurze Beschreibung für das Event an.",
        "MK_EVENT_REMINDER": "Falls automatisch eine Erinnerung gepostet werden soll, gib jetzt an, wie viele Minuten vor dem Event das geschehen soll. Gib eine negative Zahl an, falls du keine Erinnerung möchtest.",
        "MK_EVENT_TIMEOUT": "Das Zeitlimit für die Eingabe wurde überschritten und die Event-Erstellung abgebrochen. Du kannst den Prozess erneut starten.",

        "ACHIEVEMENT_UNLOCKED": "Erfolg freigeschaltet",

        "ACHIEVEMENT_NAME_GLIMMER": "Schimmer",
        "ACHIEVEMENT_DESC_GLIMMER": "Leite für eine Stunde.",
        "ACHIEVEMENT_FLAV_GLIMMER": "Willkommen auf der Brücke, Kommandeur!",

        "ACHIEVEMENT_NAME_SUNRAY": "Sonnenstrahl",
        "ACHIEVEMENT_DESC_SUNRAY": "Leite für zehn Stunden.",
        "ACHIEVEMENT_FLAV_SUNRAY": "Willkommen zurück, Kommandeur!",

        "ACHIEVEMENT_NAME_BLAZINGLIGHT": "Gleißendes Licht",
        "ACHIEVEMENT_DESC_BLAZINGLIGHT": "Leite für einhundert Stunden.",
        "ACHIEVEMENT_FLAV_BLAZINGLIGHT": "Die Truppen zählen auf Euch.",

        "ACHIEVEMENT_NAME_SUPERNOVA": "Supernova",
        "ACHIEVEMENT_DESC_SUPERNOVA": "Leite für eintausend Stunden.",
        "ACHIEVEMENT_FLAV_SUPERNOVA": "Heerscharen harren Eurer.",

        "ACHIEVEMENT_NAME_TRAILBLAZER": "Vorreiter",
        "ACHIEVEMENT_DESC_TRAILBLAZER": "Leite während eines Resets. Schalte dazu deine Lampe schon vor dem Reset an leite ab dann mindestens zwei Stunden.",
        "ACHIEVEMENT_FLAV_TRAILBLAZER": "Du bist die Ruhe vor dem Sturm.",

        "ACHIEVEMENT_NAME_OWL": "Eule",
        "ACHIEVEMENT_DESC_OWL": "Leite eine Nachtschicht. Schalte dazu deine Lampe zwischen 23:00 Uhr und 6:00 Uhr für mindestens eine Stunde an.",
        "ACHIEVEMENT_FLAV_OWL": "Wer zergt so spät durch Nacht und Wind? Es ist der Kommandeur, die Furcht er euch bringt.",

        "ACHIEVEMENT_NAME_EARLYBIRD": "Früher Vogel",
        "ACHIEVEMENT_DESC_EARLYBIRD": "Leite eine Frühschicht. Schalte dazu deine Lampe zwischen 6:00 Uhr und 10:00 Uhr für mindestens eine Stunde an.",
        "ACHIEVEMENT_FLAV_EARLYBIRD": "Ich liebe den Geruch von Sandschatten am Morgen! ",
        
        "ACHIEVEMENT_NAME_ANNIHILATOR": "Vernichter",
        "ACHIEVEMENT_DESC_ANNIHILATOR": "Der Server erreicht unter deiner Leitung eine gesamte KDR von 2.",
        "ACHIEVEMENT_FLAV_ANNIHILATOR": "Färbe den Boden mit ihrem Blut..",

        "ACHIEVEMENT_NAME_NEVERSURRENDER": "Niemals Aufgeben!",
        "ACHIEVEMENT_DESC_NEVERSURRENDER": "Beginne einen Schlachtzug wenn der Server eine KD von 0,6 oder weniger hat.",
        "ACHIEVEMENT_FLAV_NEVERSURRENDER": "Sie mögen uns das Leben nehmen, doch niemals nehmen sie uns unsere Freiheit!",

        "ACHIEVEMENT_NAME_CONQUEROR": "Eroberer",
        "ACHIEVEMENT_DESC_CONQUEROR": "Der Server erreicht unter deiner Leitung einen Tick von 250.",
        "ACHIEVEMENT_FLAV_CONQUEROR": "Färbe die Karte mit unseren Farben.",

        "ACHIEVEMENT_NAME_UNCHALLENGEDSOVEREIGN": "Unbestrittener Herrscher",
        "ACHIEVEMENT_DESC_UNCHALLENGEDSOVEREIGN": "Schloss Steinnebel ist während deiner Leitung nicht gefallen. Dazu muss Schloss Steinnebel mindestens eine Stunde lang während deines Schlachtzuges unter unserer Kontrolle stehen.",
        "ACHIEVEMENT_FLAV_UNCHALLENGEDSOVEREIGN": "Es ist gut, der König zu sein.",

        "ACHIEVEMENT_NAME_AGILEDEFENDER": "Agiler Verteidiger",
        "ACHIEVEMENT_DESC_AGILEDEFENDER": "Unter deiner Leitung wurde keine unserer Befestigungen der Stufe 3 von Feinden eingenommen. Dieses Achievement wird nur vergeben, wenn dein Raid zur Primetime begann (zwischen 18:00 und 21:00), du mindestens eine Stunde lang leitest und wir bereits zu Beginn deines Raids mindestens drei Befestigungen der Stufe 3 kontrollieren.",
        "ACHIEVEMENT_FLAV_AGILEDEFENDER": "Wenn ihr uns ruft, dann werden wir kommen.",

        "ACHIEVEMENT_NAME_THOROUGHCOMMANDER": "Gründlicher Feldherr",
        "ACHIEVEMENT_DESC_THOROUGHCOMMANDER": "Alle Befestigungen einer beliebigen Karte gehören während deiner Leitung vollständig uns. Das schließt nur Lager, Türme, Festungen und Schloss Steinnebel ein.",
        "ACHIEVEMENT_FLAV_THOROUGHCOMMANDER": "Das ist unser Königreich. Alles, was das Licht berührt.",

        "ACHIEVEMENT_NAME_BOLDBESIEGER": "Dreister Belagerer",
        "ACHIEVEMENT_DESC_BOLDBESIEGER": "Nimm während deiner Raids zehn Befestigungen der Stufe 3 ein.",
        "ACHIEVEMENT_FLAV_BOLDBESIEGER": "Hat das nicht eben noch uns gehört?!",

        "ACHIEVEMENT_NAME_TENACIOUSBESIEGER": "Beharrlicher Belagerer",
        "ACHIEVEMENT_DESC_TENACIOUSBESIEGER": "Nimm während deiner Raids 100 Befestigungen der Stufe 3 ein.",
        "ACHIEVEMENT_FLAV_TENACIOUSBESIEGER": "Wir haben die Brücke und die zweite Halle genommen. Sie haben das Tor versperrt, können es aber nicht lange halten. Die Erde bebt.",

        "ACHIEVEMENT_NAME_PRINCESS": "Prinzessin",
        "ACHIEVEMENT_DESC_PRINCESS": "Nimm während deines Raids den Fischadler-Palast ein",
        "ACHIEVEMENT_FLAV_PRINCESS": "\"Ich bin eine Prinzessin!\" -- Unbekannt ",

        "ACHIEVEMENT_NAME_CASTLING": "Rochade",
        "ACHIEVEMENT_DESC_CASTLING": "Nimm eine höherwertige Befestigung eines Gegners ein, der gleichzeitig eine unserer Befestigungen einnimmt.",
        "ACHIEVEMENT_FLAV_CASTLING": "Ein fairer Tausch.",

        "ACHIEVEMENT_NAME_ETTIN": "Ettin",
        "ACHIEVEMENT_DESC_ETTIN": "Leite gleichzeitig mit mindestens einem weiteren Kommandeur einen Schlachtzug. Nur Kommandeure, die bereits für mindestens eine Stunde leiten zählen.",
        "ACHIEVEMENT_FLAV_ETTIN": "Divide et impera.",

        "ACHIEVEMENT_NAME_HYDRA": "Hydra",
        "ACHIEVEMENT_DESC_HYDRA": "Leite gleichzeitig mit mindestens zwei weiteren Kommandeuren einen Schlachtzug. Nur Kommandeure, die bereits für mindestens eine Stunde leiten zählen.",
        "ACHIEVEMENT_FLAV_HYDRA": "Schlagt einen Kopf ab, und zwei weitere werden ihren Platz einnehmen.",

        "ACHIEVEMENT_NAME_SHIFTCHANGE": "Schichtwechsel",
        "ACHIEVEMENT_DESC_SHIFTCHANGE": "Übernimm die Leitung eines Schlachtzuges von einem Kommandeur. Beginne dazu einen Schlachtzug im selben Kanal während ein anderer Kommandeur leitet oder spätestens fünf Minuten nach diesem. Leite dann mindestens eine Stunde.",
        "ACHIEVEMENT_FLAV_SHIFTCHANGE": "Bin ich froh, dass du da bist.",

        "ACHIEVEMENT_NAME_BULLETPROOF": "Kugelsicher",
        "ACHIEVEMENT_DESC_BULLETPROOF": "Beginne einen Raid für mindestens eine Stunde, wenn das Matchup bereits gelaufen ist. Dieses Achievement wird dann vergeben, wenn sich unsere Platzierung nicht weiter verändern kann.",
        "ACHIEVEMENT_FLAV_BULLETPROOF": "Hinter diesem Kommandeursabzeichen ist nicht nur ein Spieler, hinter diesem Kommandeursabzeichen steckt eine Idee... und Ideen sind unzerstörbar.",

        "ACHIEVEMENT_NAME_BOOZECOMMANDER": "Promillekommandeur",
        "ACHIEVEMENT_DESC_BOOZECOMMANDER": "Führe einen Saufraid.",
        "ACHIEVEMENT_FLAV_BOOZECOMMANDER": "Das ist unfair! Die sind plötzlich doppelt so viele!",

        "ACHIEVEMENT_NAME_FROMASHES": "Aus der Asche",
        "ACHIEVEMENT_DESC_FROMASHES": "Trage dazu bei, den Server aus dem T4 aufsteigen zu lassen.",
        "ACHIEVEMENT_FLAV_FROMASHES": "Sie haben uns alles genommen. Auch unsere Furcht.",

        "ACHIEVEMENT_NAME_THEPRESIDENT": "Der Präsident",
        "ACHIEVEMENT_DESC_THEPRESIDENT": "",
        "ACHIEVEMENT_FLAV_THEPRESIDENT": "",

        "ACHIEVEMENT_NAME_MOUNTAINISCALLING": "Der Berg Ruft",
        "ACHIEVEMENT_DESC_MOUNTAINISCALLING": "Trage dazu bei, den Server aus dem T3 aufsteigen zu lassen.",
        "ACHIEVEMENT_FLAV_MOUNTAINISCALLING": "Wos sogt er? Sellerie?",

        "ACHIEVEMENT_NAME_THEPEAK": "Der Gipfel",
        "ACHIEVEMENT_DESC_THEPEAK": "Trage dazu bei, den Server aus dem T2 aufsteigen zu lassen.",
        "ACHIEVEMENT_FLAV_THEPEAK": "Die schönste Aussicht.",

        "ACHIEVEMENT_NAME_TIERSOLIDIFIER": "Verfestiger",
        "ACHIEVEMENT_DESC_TIERSOLIDIFIER": "Trage dazu bei, den Server im aktuellen Tier zu halten.",
        "ACHIEVEMENT_FLAV_TIERSOLIDIFIER": "Mh is'n hübsches Tierchen. Das nehm' ich!",

        "ACHIEVEMENT_NAME_STAMINACOMMANDER": "Ausdauernder Kommandeur",
        "ACHIEVEMENT_DESC_STAMINACOMMANDER": "Leite für fünf Stunden am Stück.",
        "ACHIEVEMENT_FLAV_STAMINACOMMANDER": "Ist wahrscheinlich nur auf dem Keyboard eingeschlafen.",

        "ACHIEVEMENT_NAME_INFINITESTAMINA": "Unerschöpfliche Ausdauer",
        "ACHIEVEMENT_DESC_INFINITESTAMINA": "Leite für zehn Stunden am Stück.",
        "ACHIEVEMENT_FLAV_INFINITESTAMINA": "Gar nicht so schwierig. Einfach mal den Kaffee mit Red Bull aufgießen."
    }
};

/**
* Tries to resolve the passed key into a locale string. 
* 
* @param key - the key to get the locale string for
* @param args - optional, the arguments that are to be formatted into the resolved string
* @returns if a locale string could be found, that string with the passed arguments inserted into it, if it contains placeholders. 
*          If no locale string could be found, the key is returned instead.
*/
export function get(key: string, args?: string[], separator: string = "\n", flags = true, options: {[option: string]: boolean} = {}): string {
    const flagIcons = [flags ? ":flag_de: " : "", flags ? ":flag_gb: " : ""];
    const strings = [key in DE ? DE[key].formatUnicorn(args) : key, key in EN ? EN[key].formatUnicorn(args) : key]
                    .map(s => {
                        if("italic" in options && options["italic"] === true) {
                            s = `_${s}_`;
                        }
                        if("bold" in options && options["bold"] === true) {
                            s = `**${s}**`;
                        }
                        return s;
                    });  

    return [0,1].map(i => `${flagIcons[i]}${strings[i]}`)
                .join(separator);
    //return `${flagde}${sde}${separator}${flagen}${sen}`;
    //return ":flag_de: {0}{1}:flag_gb: {2}".formatUnicorn(sde, separator, sen);
    //return key in DE ? DE[key].formatUnicorn(args) : key;
};
