var DE = {
    "NO_DEL_PERM": "Ich kann leider keine Nachrichten löschen. Bitte entferne aus Sicherheitsgründen deine letzte Nachricht manuell.",
    "KEY_INVALID_FORMAT": "Bitte gib mir einen gültigen API-Key. Diesen erhältst du auf https://account.arena.net/.",
    "KEY_ACCEPTED": "Herzlich willkommen, Flussufler!",
    "KEY_DECLINED": "Der von dir angegebene Account ist derzeit nicht auf Flussufer angesiedelt.",
    "CHECKING_KEY": "Prüfe API-Key...",
    "REG_ROLE_NOT_FOUND": "Die eingestellte Rolle existiert nicht auf dem Server. Bitte informiere einen Administrator.",
    "PRUNING_COMPLETE": "API-Keys wurden erfolgreich re-validiert.",
    "KEY_INVALIDATED": "Hallo!\nDer von dir angegebene API-Key ist nicht mehr auf Flussufer angesiedelt.\nDaher müssen wir dir leider die Zugangsrechte für den privaten Bereich entziehen. Du kannst dich gerne jederzeit mit einem neuen API-Key authentifizieren."
}

exports.get = function(key) {
    return key in DE ? DE[key] : key;
};