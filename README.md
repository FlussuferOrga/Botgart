## Installation

### Node
All dependencies and deployment are managed through `node`. So [install that](https://www.npmjs.com/get-npm) and the (included) *Node Package Manager* `npm` first.

### Dependencies
All dependencies are aggregated in `package.json` and can be installed by using 

```
npm install
```

with no arguments from the root directory of the project.

### Typescript
Botgart has been converted to [Typescript](https://en.wikipedia.org/wiki/TypeScript). You can install the Typescript-transpiler globally with

```
sudo npm install -g typescript
```

Only ever edit the Typescript source in the `src/` directory, not the Javascript files in `built/`. Even if you do write plain Javascript (you should not), put it in the `src/` directory. The transpiler will just copy `.js`-files and only transpile `.ts`-files.
After making your changes, call `tsc` from the root directory to transpile your code into the `built/`-directory, which can be run as a Node project (see below).

### Config
The root directory holds a `config.json.example`. Copy it to `config.json` and adjust the values inside to your needs.

#### Token
The bot token is how your app knows as which discord account it should connect.
You can acquire one at the [application section of discord](https://discordapp.com/developers/applications/me).

## Run
You can run your bot by using 

```
node built/index.js
```

from the root directory of your project. 
Don't forget to transpile your code after making changes to the `src/` directory.
For development, I recommend using [the forever package](https://stackoverflow.com/a/19594679) to restart the bot when the transpiler has finished. If you have it installed, you can run the `run_devel.sh`-script to start your bot for development.

## Logging
Logs will be written to the `log/`-directory and to the console. Logfiles are cummulative and should be cleared manually from time to time. Use `Util.log(level:string, prefix:string, message:string)` to log messages yourself. See below (winston) for more information on logging.

## Dependencies
Botgart uses several dependencies (that are automatically installed in one of the above steps) to make our lives easier:

- [discord.js](https://discord.js.org/#/) handles the basic interaction with Discord and provides most of the classes 
- [discord-akairo](https://discord-akairo.github.io/#/) adds additional functionality for bots, like easy to use commands and listeners 
- [gw2api-client](https://github.com/queicherius/gw2api-client) offers a wrapper around the GW2-API (and is apparently used by sites like gw2efficiency!)
- [winston](https://github.com/winstonjs/winston) is a general purpose logger. See the documentation for available logging levels

## Backups
The `db/` directory contains a script `make_backup.sh` for seven-day-rotating database backups in the directory `db/bak/`. The script can either be run manually or be added as a cron, as described on [the site I have taken the script from](https://www.zzzzzzzzz.net/daily-backup-sqlite3-database-shell-script/).

## Docker Compose
```
version: "3.3"
services:
  ts-bot:
    build: https://github.com/ogrady/Botgart.git
    environment:
      TS_LISTENER_IP: "ts3bot.local" #hostname or ip
      TS_LISTENER_PORT: "10137" #hostname or ip
    volumes:
      - ./botgart/log:/app/log
      - ./botgart/db:/app/db
      - ./botgart/config.json:/app/config.json
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
```
A list of environment variables can be seen in Config.ts