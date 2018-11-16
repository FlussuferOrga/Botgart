var DE = {
    "NO_DEL_PERM": "Ich kann leider keine Nachrichten löschen. Bitte entferne aus Sicherheitsgründen deine letzte Nachricht manuell.",
    "KEY_INVALID_FORMAT": "Bitte gib mir einen gültigen API-Key. Diesen erhältst du auf https://account.arena.net/.",
    "KEY_ACCEPTED": "Herzlich willkommen, Flussufler! Bitte lies dir die Informationen im INFOCENTER durch, um Discord im vollen Maße nutzen zu könne. :)",
    "KEY_DECLINED": "Der von dir angegebene Account ist derzeit nicht auf Flussufer angesiedelt.",
    "KEY_NOT_UNIQUE": "Der von dir angegebene API-Key ist leider schon in Benutzung. Bitte generiere einen neuen Key.\nEntferne den alten Key auf https://account.arena.net/, falls dir dessen Nutzung nicht bekannt ist.",
    "KEY_INVALIDATED": "Hallo!\nDer von dir angegebene API-Key ist nicht mehr auf Flussufer angesiedelt.\nDaher müssen wir dir leider die Zugangsrechte für den privaten Bereich entziehen. Du kannst dich gerne jederzeit mit einem neuen API-Key authentifizieren.",
    "CHECKING_KEY": "Prüfe API-Key...",
    "REG_ROLE_NOT_FOUND": "Die eingestellte Rolle existiert nicht auf dem Server. Bitte informiere einen Administrator.",
    "PRUNING_COMPLETE": "API-Keys wurden erfolgreich re-validiert.",
    "WELCOME": "Herzlich willkommen auf dem Flussufer-Discord! :)\nEin Großteil des Servers ist für Gäste nicht zugänglich. Bitte authentifiziere dich mittels eines API-Keys in der Eingangshalle des Servers:\n\n1. Besuche dazu https://account.arena.net/applications\n2. Klicke auf \"Neuer Schlüssel\"\n3. Poste `,auth ` gefolgt von deinem neuen Schlüssel in der Eingangshalle des Servers oder per Direktnachricht an mich.",
    "NOT_AVAILABLE_AS_DM": "Dieser Befehl ist per Privatnachricht nicht nutzbar. Bitte versuche es auf einem Server erneut.",
    "CRONJOB_STORED": "Dein Cronjob wurde gespeichert mit der ID: ",
    "CRONJOB_NOT_STORED": "Dein Cronjob konnte nicht erstellt werden. Möglicherweise ist die von dir übergebene Zeitangabe ungültig. Du kannst diese auf https://crontab.guru/ überprüfen."
}

exports.get = function(key) {
    return key in DE ? DE[key] : key;
};