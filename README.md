## Installation

### Node

All dependencies and deployment are managed through `node`. So [install that](https://www.npmjs.com/get-npm) and the (
included) *Node Package Manager* `npm` first.

### Dependencies

All dependencies are aggregated in `package.json` and can be installed by using

```shell
npm install
```

with no arguments from the root directory of the project.

### Typescript

Botgart has been written in [Typescript](https://en.wikipedia.org/wiki/TypeScript).

Only ever edit the Typescript source in the `src/` directory, not the Javascript files in `built/`. Even if you do write
plain Javascript (you should not), put it in the `src/` directory. The transpiler will just copy `.js`-files and only
transpile `.ts`-files.
After making your changes, call `npm run build` from the root directory to transpile your code into the `built/`-directory,
which can be run as a Node project (see below).

### Config

The root directory holds a `config/example.config.json`. Rename it to `config.json` and adjust the values inside to your
needs.

#### Token

The bot token is how your app knows as which discord account it should connect.
You can acquire one at the [application section of discord](https://discordapp.com/developers/applications/me).

## Run

You can run your bot by using
```shell
node built/index.js
```
from the root directory of your project.