require("dotenv").config();

const axios = require("axios");
const tmi = require("tmi.js");
const tinycolor = require("tinycolor2");

const CHANNEL = process.env.CHANNEL;
const REWARD_ID = process.env.REWARD_ID;
const TOKEN = process.env.NANOLEAF_API_TOKEN;
const BASE_URL = `${process.env.NANOLEAF_BASE_URL}/${TOKEN}`;
const DEFAULT_BRIGHTNESS = process.env.NANOLEAF_DEFAULT_BRIGHTNESS;
const HEX_REGEX = /^#?([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/i;

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const $axios = axios.create({
  baseURL: BASE_URL,
});
const client = new tmi.Client({
  connection: {
    secure: true,
    reconnect: true,
  },
  channels: [CHANNEL],
});

client.connect();

console.log("Listening for reward redemptions...");

client.on("message", async (__, context, message) => {
  if (context["custom-reward-id"] === REWARD_ID) {
    const hexMatches = message.trim().match(HEX_REGEX);
    if (hexMatches) {
      try {
        let [hexColor] = hexMatches;
        hexColor = hexColor.startsWith("#") ? hexColor : `#${hexColor}`;
        await setColor(hexColor);
        console.log(`Set Nanoleafs to ${hexColor}!`);
      } catch (e) {
        console.log(`Failed to set color to ${message.trim()}`);
      }
    } else {
      console.log(`Failed to set color to ${message.trim()}`);
    }
  }
});

const setColor = (color) => {
  const { h, s } = tinycolor(color).toHsl();
  const hue = Math.round(h);
  const sat = clamp(Math.round(s * 100), 0, 100);

  return $axios.put("/state", {
    hue: { value: hue },
    sat: { value: sat },
    brightness: { value: DEFAULT_BRIGHTNESS },
  });
};
