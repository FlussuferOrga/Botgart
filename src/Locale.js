var DE = {
	"NO_DEL_PERM": "Ich kann leider keine Nachrichten löschen. Bitte entferne aus Sicherheitsgründen deine letzte Nachricht manuell.",
	"KEY_INVALID_FORMAT": "Bitte gib mir einen gültigen API-key. Diesen erhältst du auf https://account.arena.net/.",
	"KEY_ACCEPTED": "Herzlich willkommen, Flussufler!",
	"KEY_DECLINED": "Der von dir angegebene Account ist derzeit nicht auf Flussufer angesiedelt."
}

exports.get = function(key) {
	return key in DE ? DE[key] : key;
};