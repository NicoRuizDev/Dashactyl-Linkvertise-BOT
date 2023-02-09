require("dotenv").config();
const Discord = require("discord.js");
const { MessageActionRow, MessageButton } = require("discord.js");
const express = require("express");
const axios = require("axios");
const link = require("linkvertise.js");
const ejs = require("ejs");
const userId = process.env.LINKVERTISE_USER_ID;
const linkvertise = new link(userId);
const client = new Discord.Client({ intents: 32767 });
const app = express();
const port = 80;
const data = {};
const appURL = process.env.APP_URL;
const cooldownTime = 20 * 60 * 1000;
const cooldowns = new Map();

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("assets"));

function generateToken() {
  var length = 50,
    charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890",
    token = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    token += charset.charAt(Math.floor(Math.random() * n));
  }
  return token;
}

client.on("messageCreate", (message) => {
  if (message.content.startsWith("!earn")) {
    const id = message.author.id;
    const options = {
      method: "GET",
      url: process.env.DASH_URL + "/api/userinfo/",
      params: { id: id },
      headers: { Authorization: `Bearer ${process.env.DASH_API}` },
    };
    axios.request(options).then(async function (response) {
      RESdata = response.data;
      if (RESdata.status == "invalid id") {
        message.reply(
          `Your are not registered! Register on: ${process.env.DASH_URL}/login`
        );
      } else {
        if (cooldowns.has(message.author.id)) {
          const expirationTime =
            cooldowns.get(message.author.id) + cooldownTime;
          if (Date.now() < expirationTime) {
            let seconds = (expirationTime - Date.now()) / 1000;
            let minutes = Math.floor(seconds / 60);
            let extraSeconds = seconds % 60;
            extraSeconds =
              extraSeconds < 10 ? "0" + extraSeconds : extraSeconds;

            let embed = new Discord.MessageEmbed()
              .setTitle("Cooldown!")
              .setDescription(
                "Please wait `" +
                  `${minutes}` +
                  " minutes` and `" +
                  `${Math.floor(extraSeconds)} ` +
                  "seconds` before generating the link again."
              )
              .setColor("#0099ff");
            message.reply({
              content: `<@${message.author.id}>`,
              embeds: [embed],
            });
            return;
          }
        } else {
          cooldowns.set(message.author.id, Date.now());
          let user = message.author.id;
          let otp = generateToken();
          data[otp] = generateToken();
          let url = process.env.APP_URL + "/earn/" + user + "/" + otp;
          const row = new MessageActionRow().addComponents(
            new MessageButton()
              .setURL(url)
              .setLabel("Earn Coins")
              .setStyle("LINK")
          );
          let embed = new Discord.MessageEmbed()
            .setTitle("Earn Coins")
            .setDescription(
              "**Success!** Link Generated for user: `" +
                user +
                "` \n```Hint: Use below buttons to get the link.```"
            )
            .setColor("#0099ff")
            .setFooter({
              text: `Requested By ${message.author.tag} | Made with ❤️ by NicoRuizDev`,
              iconURL: `${process.env.APP_ICON}`,
            });
          message.reply({
            content: `<@${message.author.id}>`,
            embeds: [embed],
            components: [row],
          });
        }
      }
    });
  }
});

app.get("/earn/:user/:otp", (req, res) => {
  const user = req.params.user;
  const otp = req.params.otp;
  let url = `/redirect/${user}/${otp}`;
  res.render("start", { url: url });
});

app.get("/redirect/:user/:otp", (req, res) => {
  const user = req.params.user;
  const otp = req.params.otp;
  const token = data[otp];
  let url = `${appURL}/verify/${user}/${otp}/${token}`;
  let shrink = linkvertise.shrink(url);
  res.redirect(shrink);
});

app.get("/verify/:user/:otp/:token", (req, res) => {
  const user = req.params.user;
  const otp = req.params.otp;
  const token = data[otp];
  const coins = process.env.COINS_TO_GIVE;
  if (data[otp] == undefined) {
    res.redirect("/404");
  } else if (data[otp] == token) {
    const dataRES = { id: user, coins: coins };
    axios
      .post(process.env.DASH_URL + "/api/setcoins", dataRES, {
        headers: {
          Authorization: `Bearer ${process.env.DASH_API}`,
        },
      })
      .then(() => {
        delete data[otp];
        res.render("success", { coins: coins, user: user });
      });
  } else {
    res.redirect("/404");
  }
});

app.get("/404", (req, res) => {
  res.render("404");
});

app.listen(port, () => console.log(`Application listening on port ${port}!`));

client.once("ready", (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
