/* eslint-disable */
import type { Translation } from "../i18n-types";

const de = {
    commands: {
        auth: {
            name: "auth",
            description: "Authentifiziere dich auf diesem Server mit deinem API Key",
            opt: {
                api_key: {
                    description: "Dein GuildWars2 API Schlüssel",
                },
            },
        },
    },
    // this is an example Translation, just rename or delete this folder if you want
    HI: "Hallo {name}! Bitte hinterlasse einen Stern, wenn dir das Projekt gefällt: https://github.com/ivanhofer/typesafe-i18n",
} satisfies Translation;

export default de;
