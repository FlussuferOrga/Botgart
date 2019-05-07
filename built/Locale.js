"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DE = {
    "INTERNAL_ERROR": "Ein interner Fehler ist aufgetreten. Bitte benachrichtige einen Administrator, damit dieser sich des Problems annehmen kann.",
    "WELCOME": "Herzlich willkommen auf dem Flussufer-Discord! :)\nEin Großteil des Servers ist für Gäste nicht zugänglich. Bitte authentifiziere dich mittels eines API-Keys:\n\n1. Besuche dazu https://account.arena.net/applications\n2. Klicke auf \"Neuer Schlüssel\"\n3. Poste `,auth ` gefolgt von deinem neuen Schlüssel per Direktnachricht (dieses Fenster) an mich.\n\nZ.B: `,auth 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111`.",
    "NO_SUCH_COMMAND": "Den von dir angegebenen Befehl '{0}' kenne ich nicht.",
    "NOT_AVAILABLE_AS_DM": "Dieser Befehl ist per Privatnachricht nicht nutzbar. Bitte versuche es auf einem Server erneut.",
    "NOT_CRONABLE": "Dieser Befehl kann nicht als Teil eines Cronjobs verwendet werden.",
    "NO_DEL_PERM": "Ich kann leider keine Nachrichten löschen. Bitte entferne aus Sicherheitsgründen deine letzte Nachricht manuell.",
    "KEY_INVALID_FORMAT": "Bitte gib mir einen gültigen API-Key. Diesen erhältst du auf https://account.arena.net/.",
    "KEY_ACCEPTED": "Herzlich willkommen, Flussufler! Bitte lies dir die Informationen im INFOCENTER durch, um Discord im vollen Maße nutzen zu können. :)",
    "KEY_DECLINED": "Der von dir angegebene Account ist derzeit nicht auf Flussufer angesiedelt.",
    "KEY_NOT_UNIQUE": "Der von dir angegebene API-Key ist leider schon in Benutzung. Bitte generiere einen neuen Key.\nEntferne den alten Key auf https://account.arena.net/, falls dir dessen Nutzung nicht bekannt ist.",
    "KEY_INVALIDATED": "Hallo!\nDer von dir angegebene API-Key ist nicht mehr auf Flussufer angesiedelt.\nDaher müssen wir dir leider die Zugangsrechte für den privaten Bereich entziehen. Du kannst dich gerne jederzeit mit einem neuen API-Key authentifizieren.",
    "CHECKING_KEY": "Prüfe API-Key...",
    "REG_ROLE_NOT_FOUND": "Die eingestellte Rolle existiert nicht auf dem Server. Bitte informiere einen Administrator.",
    "PRUNING_COMPLETE": "API-Keys wurden erfolgreich re-validiert.",
    "FIND_DUPES_COMPLETE": "Duplikatsuche abgeschlossen.",
    "GUILD_LOG_COMPLETE": "Gilden-Logbuch erfolgreich abgerufen.",
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
    "GUILD_LOG_PERMISSION_FAIL": "Für das Abrufen des Gilden-Logbuchs muss ein API-Key des Anführers hinterlegt sein.",
    "TAPREMINDER_STORED": "Ich habe eine Erinnerung für \"{0}\" hinzugefügt.",
    "TAPREMINDER_REMIND": "@Tapper \"{0}\" muss getappt werden.",
    "HELPTEXT_SAY": "Bitte benutze den Befehl mit folgenden Parametern:\n`<Channel, in dem der Bot sprechen soll> \"<Text, den der Bot abschicken soll>\"`.",
    "HELPTEXT_ADD_CRON": "Bitte benutze den Befehl mit folgenden Parametern:\n\"`<Cron-Scheduling-String (UNIX-Format)>`\" \"`<Befehl, der gescheduled werden soll>`\" `<Parameter für den vorausgehenden Befehl, entsprechend dessen Hilfetext>`.",
    "HELPTEXT_DEL_CRON": "Bitte benutze den Befehl mit folgendem Parameter:\n`<ID des Cronjobs, der gelöscht werden soll>`\nIDs aller Cronjobs kannst du mit dem `lscrons`-Befehl anzeigen lassen.",
    "HELPTEXT_POLL": "Bitte benutze den Befehl mit folgenden Parametern:\n`<Channel, in dem der Poll erstellt werden soll> \"<Frage, um die es im Poll geht>\" \"<Emotes, die zur Reaktion zur Verfügung stehen sollen>\"`.",
    "HELPTEXT_ADD_FAQ": "Bitte benutze den Befehl mit folgenden Parametern:\n`\"<Schüsselwörter, die mit der Antwort verknüpft werden sollen. Werden am Semikolon (;) getrennt>` `\"<Text, der angezeigt werden sollen>\"`.",
    "HELPTEXT_GET_FAQ": "Bitte benutze den Befehl mit folgendem Parameter:\n`<Schüsselwort>`",
    "HELPTEXT_DEL_FAQ": "Bitte benutze den Befehl mit folgendem Parameter:\n`<Schüsselwort>`",
    "HELPTEXT_GUILD_LOG": "Bitte benutze den Befehl mit folgenden Parametern:\n\"`<Name der Gilde>`\" `<API Key des Anführers>` `<Channel, in dem der Log geschrieben werden soll>`",
    "HELPTEXT_TAP_REMINDER": "Bitte benutze den Befehl mit folgenden Parametern:\n\"`<objective>`\".",
    "DESC_DEL_CRON": "Löscht den Cronjob mit der angegebenen ID.",
    "DESC_LIST_CRONS": "Listet alle offenen Cronjobs auf.",
    "DESC_MAKE_CRON": "Erstellt einen neuen Cronjob auf den angegebenen Zeitpunkt",
    "DESC_AUTHENTICATE": "Authentifiziert einen Benutzer mittels eines GW2-API-Keys.",
    "DESC_POLL": "Erstellt einen Poll mit vorgegebenen Emotes als Abstimmoptionen.",
    "DESC_REAUTHENTICATE": "Authentifiziert alle vorhandenen GW2-API-Keys erneut.",
    "DESC_SAY": "Spricht den übergebenen Text im übergebenen Channel.",
    "DESC_HELP": "Dieser Befehl. Listet alle verfügbaren Befehle mit einer kurzen Beschreibung auf.",
    "DESC_TS_SYNC": "Synchronisiert die Rollen mit dem Teamspeak3-Server (_NICHT AKTIV_).",
    "DESC_ADD_FAQ": "Fügt den FAQ einen Eintrag hinzu.",
    "DESC_DEL_FAQ": "Entfernt einen Eintrag von den FAQ.",
    "DESC_GET_FAQ": "Gibt die Antwort zu einem Stichwort der FAQ wieder.",
    "DESC_LIST_FAQS": "Listet alle vorhandenen FAQs auf.",
    "DESC_FIND_DUPES": "Findet alle Discord-Benutzer, die sich einen GW2-Account teilen.",
    "DESC_GUILD_LOG": "Schreibt den Guildlog einer Gilde in einen Discord-Channel.",
    "DESC_TAP_REMINDER": "Erinnert dich in ~50 Minuten die Siege zu tappen.",
};
/**
* Tries to resolve the passed key into a locale string.
*
* @param key - the key to get the locale string for
* @param args - optional, the arguments that are to be formatted into the resolved string
* @returns if a locale string could be found, that string with the passed arguments inserted into it, if it contains placeholders.
*          If no locale string could be found, the key is returned instead.
*/
function get(key, args) {
    return key in exports.DE ? exports.DE[key].formatUnicorn(args) : key;
}
exports.get = get;
;
