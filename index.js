const express = require('express')
const app = express()
const m = require('ms');
 
app.get('/', function (req, res) {
  res.send('Devil is Online')
})
 let port = process.env.PORT || 3000;
app.listen(port)
 
require('dotenv').config()
///////////////////////EMPIEZA/TU/BOT//////////////////////////////

const Discord = require("discord.js")
const client = new Discord.Client();

client.cooldowns = new Discord.Collection();
client.commands = new Discord.Collection();

const fs = require('fs');
const { readdirSync } = require("fs");
const config = require("./config.json")

var prefix = "!"

const ms = require('ms')

const mega = require("megadb");
//llammamos a la db
let prefixdb = new mega.crearDB("Prefixes");

//requiriendo a la carpeta comandos y todas las subcarpetas pd: no poner comandos directamente en la capeta comandos
const commandFolders = fs.readdirSync("./comandos");
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./comandos/${folder}`).filter(file => file.endsWith(".js"))
  for (const file of commandFiles) {
    const command = require(`./comandos/${folder}/${file}`);
    client.commands.set(command.name, command)
  }
}

//requiriendo archivos para un event handler
const eventFiles = fs.readdirSync('./eventos').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(`./eventos/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}


client.on("message", async message => { 
  //definimos prefix aqui
  var prefix  = prefixdb.has(message.guild.id) ? await prefixdb.get(message.guild.id) : `${config.default_prefix}`

  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  //args
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  
  //selecion de comandos
  const commandName = args.shift().toLowerCase();
  
  //comprobando el nombre del comando o alias
  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  if(!commandName)return
  if (!command) return message.channel.send("`❌| Ese comando no existe!`");

////modulos
//DM
if (command.guildOnly && message.channel.type === 'dm') {
    return message.reply('I can\'t execute that command inside DMs!');
}//fin

//onlycreator
if (command.onlycreator && message.author.id !== `${config.owners}`) {
return message.reply('Solo mi Developer puede ejecutar esto');
}//fin

///permisos user
if (command.permissions) {
    const authorPerms = message.channel.permissionsFor(message.author);
    if (!authorPerms || !authorPerms.has(command.permissions)) {
        return message.channel.send('❌ | Permisos Insuficientes!');
    }
}//fin

//permisos bot
if (command.permissionsme) {
    if (!message.guild.me.hasPermission(command.permissionsme)) {
        return message.reply(' No tengo permisos Insuficientes nesesito \n\ requiero `' + command.permissionsme + '`');
    }
}//fin

//args NON
if (command.args && !args.length) {
    let lineReply = `No has proveido argumentos, ${message.author}!`;

        if (command.usage) {
            lineReply += `\nEl uso adecuado seria \`${prefix}${command.name} ${command.usage}\``;
        }
            return message.reply(lineReply);
}//fin

  const { cooldowns } = client;

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(`Por favor espera ${timeLeft.toFixed(1)} segundos antes de volver a usar \`${command.name}\` `);
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args, prefix, client);
  } catch (error) {
    console.error(error);
    message.reply(`❌ | Ha Ocurrido Un Error Mientras Se Ejecutaba El Comando!`);
  }

})

client.on("ready", () =>{
  console.log("Bot encendido")
})

//SNIPE EVENTO 

client.snipes = new Map()

// PRESENCIA ESTADOS//

  const estados = ['Fuck Devil', '$help']

  client.on('ready', () => {

    setInterval(() => {
      function presence() {
        client.user.setPresence({
          status: 'on',
          activity: {
          name: estados[Math.floor(Math.random() * estados.length)],
          type: 'PLAYING',
        }

        })
      }
      presence()
    }, 10000);

    console.log('Devil Estados Is Ready!')
  });

client.on('messageDelete', message => {
  client.snipes.set(message.channel.id, {
    content: message.content,
    delete: message.author,
    canal: message.channel
  })
})


client.login(config.token);