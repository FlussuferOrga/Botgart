export function isValidWorldId(val) {
    return /^[1-2][0-3][0-9]{2}$/.test(val) === true; // https://wiki.guildwars2.com/wiki/API:2/worlds#Notes
}

export function isValidGuildWars2AccountHandle(value:string) {
    return /^.+\.\d{4}$/.test(value) === true
}