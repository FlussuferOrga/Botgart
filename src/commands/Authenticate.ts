import * as discord from "discord.js";
import { BotgartCommand } from "../BotgartCommand";
import { ConfigError, InvalidKeyError, NetworkError } from "../Gw2ApiUtils";
import * as L from "../Locale";
import { L as LL } from "../i18n/i18n-node";
import { logger } from "../util/Logging";
import { AkairoMessage, CommandArguments } from "@notenoughupdates/discord-akairo";
import { DeclinedApiKeyError, KeyInvalidFormatError } from "../services/ValidationService";

const LOG = logger();

const API_KEY = "api_key";

/**
 Testcases:
 - missing parameters -> error
 - valid key -> authenticated
 - valid duplicate key for the same user -> key replaced
 - valid duplicate key for another user -> error
 - invalid key with valid format -> error
 - all of the above through DM and channel -> _
 - all of the above with missing authenticate role -> error
 - cron: anything -> error
 */

export class Authenticate extends BotgartCommand {
    constructor() {
        super(
            "authenticate",
            {
                aliases: [LL.en.commands.auth.name(), "register", "authenticate"],
                description: LL.en.commands.auth.description(),
                args: [
                    {
                        id: "key",
                        type: "string",
                        default: "",
                    },
                ],
                slash: true,
                slashOnly: false,
                slashEphemeral: true,
                slashDmPermission: true,
                localization: {
                    nameLocalizations: {
                        de: LL.de.commands.auth.name(),
                    },
                    descriptionLocalizations: {
                        de: LL.de.commands.auth.description(),
                    },
                },
                slashOptions: [
                    {
                        name: API_KEY,
                        // nameLocalizations: {
                        //     "de": "api_key",
                        // },
                        required: true,
                        description: LL.de.commands.auth.opt.api_key.description(),
                        descriptionLocalizations: {
                            de: LL.de.commands.auth.opt.api_key.description(),
                        },
                        type: discord.ApplicationCommandOptionType.String,
                        minLength: 72,
                        maxLength: 72,
                    },
                ],
            },
            {
                everyonePermission: 1,
            }
        );
    }

    async execSlash(message: AkairoMessage, args: CommandArguments) {
        if (!message) {
            LOG.error("Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }
        const interaction = message.interaction;
        if (!interaction.isChatInputCommand()) return;

        const apiKey: string = args[API_KEY];

        try {
            await this.getBotgartClient().validationService.validate(apiKey, message.author);
            await interaction.editReply(L.getIn(interaction.locale, "KEY_ACCEPTED"));
        } catch (err) {
            let error = "";
            if (err instanceof KeyInvalidFormatError) {
                error = L.getIn(interaction.locale, "KEY_INVALID_FORMAT");
            } else if (err instanceof DeclinedApiKeyError) {
                error = L.getIn(interaction.locale, "KEY_DECLINED");
                //} else if (err instanceof KeyNotUniqueError) {
                //    error = L.getIn(interaction.locale, "KEY_NOT_UNIQUE");
            } else if (err instanceof ConfigError) {
                LOG.error("A world is defined more than once in the config. Please fix the config file.");
                error = L.getIn(interaction.locale, "INTERNAL_ERROR");
            } else if (err instanceof NetworkError) {
                LOG.error("Network error while trying to resolve world.");
                error = L.getIn(interaction.locale, "INTERNAL_ERROR");
            } else if (err instanceof InvalidKeyError) {
                LOG.error("Invalid key: {0}".formatUnicorn(apiKey));
                error = L.getIn(interaction.locale, "KEY_DECLINED");
            } else {
                LOG.error("Unexpected error occured while validating world.", err);
                error = L.getIn(interaction.locale, "INTERNAL_ERROR");
            }
            await interaction.editReply(error);
        }
    }

    async command(
        message: discord.Message,
        responsible: discord.User,
        guild: discord.Guild,
        args: {
            key: string;
        }
    ): Promise<void> {
        if (!message) {
            LOG.error("Mandatory message parameter missing. This command can not be issued as cron.");
            return;
        }
        let reply = (s) => message.reply(s);

        if (message.inGuild()) {
            // We only allow DMs

            // try to delete the message for privacy reasons if it is not a direct message
            await message.delete();
            const pm_message = await message.author.send(L.get("AUTH_ONLY_PM"));
            reply = (s) => pm_message.reply(s);
        }

        await reply(L.get("CHECKING_KEY"));
        // 11111111-1111-1111-1111-11111111111111111111-1111-1111-1111-111111111111
        LOG.info("Received: '" + args.key + "'");
        const apiKey = args.key.trim();

        try {
            await this.getBotgartClient().validationService.validate(apiKey, message.author);
            await reply(L.get("KEY_ACCEPTED"));
        } catch (err) {
            let error = "";
            if (err instanceof KeyInvalidFormatError) {
                error = L.get("KEY_INVALID_FORMAT");
            } else if (err instanceof DeclinedApiKeyError) {
                error = L.get("KEY_DECLINED");
                //} else if (err instanceof KeyNotUniqueError) {
                //    error = L.get("KEY_NOT_UNIQUE");
            } else if (err instanceof ConfigError) {
                LOG.error("A world is defined more than once in the config. Please fix the config file.");
                error = L.get("INTERNAL_ERROR");
            } else if (err instanceof NetworkError) {
                LOG.error("Network error while trying to resolve world.");
                error = L.get("INTERNAL_ERROR");
            } else if (err instanceof InvalidKeyError) {
                LOG.error("Invalid key: {0}".formatUnicorn(apiKey));
                error = L.get("KEY_DECLINED");
            } else {
                LOG.error("Unexpected error occured while validating world.", err);
                error = L.get("INTERNAL_ERROR");
            }
            await reply(error);
        }
    }
}

module.exports = Authenticate;
