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

from the `built/` directory of your project. 
Don't forget to transpile your code after making changes to the `src/` directory.
For development, I recommend using [the forever package](https://stackoverflow.com/a/19594679) to restart the bot when the transpiler has finished. If you have it installed, you can run the `run_devel.sh`-script to start your bot for development.
Logs will be written to the `log/`-directory and to the console.