/* eslint-disable */
import type { BaseTranslation } from "../i18n-types";

const en = {
    commands: {
        auth: {
            name: "auth",
            description: "Authenticate on this server using your API key.",
            opt: {
                api_key: {
                    description: "Your GuildWars2 API Key",
                },
            },
        },
    },
    HI: "Hi {name:string}! Please leave a star if you like this project: https://github.com/ivanhofer/typesafe-i18n",
} satisfies BaseTranslation;

export default en;
