import * as discord from "discord.js";
import { BotgartCommand } from "../../BotgartCommand";
import * as Const from "../../Const";
import { logger } from "../../Logging";

const TEASER_LENGTH = 30;
const LOG = logger();

/**
Testcases:
- list faqs -> bot lists all available faqs
*/
export class ListFaqs extends BotgartCommand {
    constructor() {
        super("listfaqs", {
                aliases: ["listfaqs","lsfaqs","lsrtfms"]
            }, 
            {
                everyonePermission: 1
            }
        );
    }

    command(message: discord.Message, responsible: discord.User, guild: discord.Guild, args: any): void {
        if(!responsible) {
            LOG.error("Can not execute lsfaqs without member to reply to. Canceling.")
            return;
        }
        let format: string = "{0} | {1}";
        let header: string = format.formatUnicorn("KEY", "       TEXT      ") + "\n";
        let mes: string = header;
        this.getBotgartClient().faqRepository.getFAQs(guild.id).forEach((faq) => {
            let t = faq.text.length < TEASER_LENGTH ? faq.text : faq.text.substring(0,TEASER_LENGTH - 3) + "...";
            let line = format.formatUnicorn(faq.key, t) + "\n";
            if(mes.length + line.length < Const.MAX_MESSAGE_LENGTH - 10) {
                // leave some space for the backticks and additional linebreaks
                mes += line;
            } else {
                // message full -> send it and start a new one
                mes = "```\n" + mes + "\n```";
                responsible.send(mes);
                mes = header + line;
            }
        });
        responsible.send("```\n" + mes + "\n```");    
    }
}

module.exports = ListFaqs;