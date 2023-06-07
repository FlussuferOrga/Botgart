import * as discord from "discord.js";
import { Locale } from "discord.js";
import { BotgartClient } from "../BotgartClient";
import { BotgartCommand } from "../BotgartCommand";
import { ConfigError, getAccountInfo, InvalidKeyError, NetworkError, validateWorld } from "../Gw2ApiUtils";
import * as L from "../Locale";
import { L as LL } from "../i18n/i18n-node";
import { logger } from "../util/Logging";
import * as Util from "../util/Util";
import { AkairoMessage, CommandArguments } from "@notenoughupdates/discord-akairo";

const LOG = logger();

const API_KEY = "api_key";

const API_KEY_REGEX = /^[A-Z0-9]{8}-([A-Z0-9]{4}-){3}[A-Z0-9]{20}-([A-Z0-9]{4}-){3}[A-Z0-9]{12}$/;

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
    private static readonly LOG_TYPE_AUTH: string = "auth";

    constructor() {
        super(
            "authenticate",
            {
                aliases: [LL.en.commands.auth.name(), "register", "authenticate"],
                description: LL.en.commands.auth.description(),
                // args: [
                //     {
                //         id: "key",
                //         type: "string",
                //         default: ""
                //     },
                // ],
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
                availableAsDM: true,
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

        const apiKey = args[API_KEY];
        const validFormat: boolean = API_KEY_REGEX.test(apiKey);
        if (!validFormat) {
            LOG.info("Invalid Format received");
            await interaction.editReply(L.getIn(interaction.locale, "KEY_INVALID_FORMAT"));
            return;
        }

        const members: { guild: discord.Guild; member: discord.GuildMember }[] = []; // plural, as this command takes place on all servers this bot shares with the user
        // this snippet allows users to authenticate themselves
        // through a DM and is dedicated to Jey, who is a fucking
        // numbnut when it comes to data privacy and posting your
        // API key in public channels.
        for (const guild of this.client.guilds.cache.values()) {
            const m: discord.GuildMember = await guild.members.fetch(message.author.id); // cache.find(m => m.id == message.author.id);
            if (m) {
                members.push({ guild: guild, member: m });
            }
        }

        const cl: BotgartClient = this.getBotgartClient();

        try {
            const acc = await getAccountInfo(apiKey);
            const validationResult = await validateWorld(acc);
            if (validationResult === false) {
                LOG.info("Declined API key {0}.".formatUnicorn(apiKey));
                await interaction.editReply(L.getIn(interaction.locale, "KEY_DECLINED"));
            } else {
                let replyString = "";
                await Util.asyncForEach(members, async (m: { guild: discord.Guild; member: discord.GuildMember }) => {
                    const role: discord.Role | undefined = (await m.guild.roles.fetch()).find((r) => r.name === validationResult.role);
                    if (role === undefined) {
                        throw Error(`Role '${validationResult}' not found on server '${m.guild.name}'. Skipping.`);
                    } else {
                        const unique = cl.registrationRepository.storeAPIKey(m.member.user.id, m.guild.id, apiKey, acc.id, acc.name, role.name); // this cast should pass, since we either resolved by now or fell back to NULL
                        if (unique) {
                            LOG.info("Accepted {0} for {1} on {2} ({3}).".formatUnicorn(apiKey, m.member.user.username, m.guild.name, m.guild.id));
                            // Beware! This is not 100% fail safe and users have figured out the weirdest ways and configurations which are just too wild to cover entirely:
                            // - players registering with multiple Discord accounts for the same GW2 account due to using multiple devices
                            // - players registering with a secondary account on the Discord account they were already using which is another server
                            // - players transferring to another world and immediately sending a new key from that very account they have already been registered with from another world
                            // - etc.
                            // which makes it hard to figure out which Discord account should have which registration role.
                            // It could therefore happen that some users end up with access to channels they should not really have, but oh well...
                            // Maybe some day someone wants to take a really good look into this.
                            await this.getBotgartClient().validationService.setMemberRolesByString(m.member, [role.name], "Authentication");
                            cl.discordLog(
                                m.guild,
                                Authenticate.LOG_TYPE_AUTH,
                                L.get("DLOG_AUTH", [Util.formatUserPing(m.member.id), acc.name as string, role.name]),
                                false
                            );
                            replyString = L.getIn(interaction.locale, "KEY_ACCEPTED");
                        } else {
                            LOG.info("Duplicate API key {0} on server {1}.".formatUnicorn(apiKey, m.guild.name));
                            replyString = L.getIn(interaction.locale, "KEY_NOT_UNIQUE");
                        }
                    }
                });
                await interaction.editReply(replyString);
            }
        } catch (err) {
            let error = "";
            if (err instanceof ConfigError) {
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
        const apiKey = args.key;
        const validFormat: boolean = API_KEY_REGEX.test(apiKey);
        if (!validFormat) {
            await reply(L.get("KEY_INVALID_FORMAT"));
            return;
        }

        const members: { guild: discord.Guild; member: discord.GuildMember }[] = []; // plural, as this command takes place on all servers this bot shares with the user
        // this snippet allows users to authenticate themselves
        // through a DM and is dedicated to Jey, who is a fucking
        // numbnut when it comes to data privacy and posting your
        // API key in public channels.
        for (const guild of this.client.guilds.cache.values()) {
            const m: discord.GuildMember = await guild.members.fetch(message.author.id); // cache.find(m => m.id == message.author.id);
            if (m) {
                members.push({ guild: guild, member: m });
            }
        }

        const cl: BotgartClient = this.getBotgartClient();

        try {
            const acc = await getAccountInfo(apiKey);
            const validationResult = await validateWorld(acc);
            if (validationResult === false) {
                LOG.info("Declined API key {0}.".formatUnicorn(apiKey));
                await reply(L.get("KEY_DECLINED"));
            } else {
                let replyString = "";
                await Util.asyncForEach(members, async (m: { guild: discord.Guild; member: discord.GuildMember }) => {
                    const role: discord.Role | undefined = (await m.guild.roles.fetch()).find((r) => r.name === validationResult.role);
                    if (role === undefined) {
                        throw Error(`Role '${validationResult}' not found on server '${m.guild.name}'. Skipping.`);
                    } else {
                        const unique = cl.registrationRepository.storeAPIKey(m.member.user.id, m.guild.id, apiKey, acc.id, acc.name, role.name); // this cast should pass, since we either resolved by now or fell back to NULL
                        if (unique) {
                            LOG.info("Accepted {0} for {1} on {2} ({3}).".formatUnicorn(apiKey, m.member.user.username, m.guild.name, m.guild.id));
                            // Beware! This is not 100% fail safe and users have figured out the weirdest ways and configurations which are just too wild to cover entirely:
                            // - players registering with multiple Discord accounts for the same GW2 account due to using multiple devices
                            // - players registering with a secondary account on the Discord account they were already using which is another server
                            // - players transferring to another world and immediately sending a new key from that very account they have already been registered with from another world
                            // - etc.
                            // which makes it hard to figure out which Discord account should have which registration role.
                            // It could therefore happen that some users end up with access to channels they should not really have, but oh well...
                            // Maybe some day someone wants to take a really good look into this.
                            await this.getBotgartClient().validationService.setMemberRolesByString(m.member, [role.name], "Authentication");
                            cl.discordLog(
                                m.guild,
                                Authenticate.LOG_TYPE_AUTH,
                                L.get("DLOG_AUTH", [Util.formatUserPing(m.member.id), acc.name as string, role.name]),
                                false
                            );
                            replyString = L.get("KEY_ACCEPTED");
                        } else {
                            LOG.info("Duplicate API key {0} on server {1}.".formatUnicorn(apiKey, m.guild.name));
                            replyString = L.get("KEY_NOT_UNIQUE");
                        }
                    }
                });
                await reply(replyString);
            }
        } catch (err) {
            let error = "";
            if (err instanceof ConfigError) {
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
