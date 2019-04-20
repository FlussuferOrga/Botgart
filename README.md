## Installation

### Node
All dependencies and deployment are managed through `node`. So [install that](https://www.npmjs.com/get-npm) and the (included) *Node Package Manager* `npm` first.

### Typescript
Botgart has been converted to [Typescript](https://en.wikipedia.org/wiki/TypeScript). You can install the Typescript-transpiler globally with

```
sudo npm install -g typescript
```

### Dependencies
All dependencies are aggregated in `package.json` and can be installed by using 

```
npm install
```

with no arguments from the root directory of the project.


### Config
The root directory holds a `config.json.example`. Copy it to `config.json` and adjust the values inside to your needs.

#### Token
The bot token is how your app knows as which discord account it should connect.
You can acquire one at the [application section of discord](https://discordapp.com/developers/applications/me).