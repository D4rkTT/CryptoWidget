const { shell } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const appName = "CryptoWidget";
const configDir = path.join(os.homedir(), "Documents", appName);
const configFile = path.join(configDir, "config.json");

const defaultConfig = {
  version: "1.0.0",
  position:{
    type: "top-right", // "custom", "top-right", "bottom-right", "bottom-left", "top-left"
    x: 0,
    y: 0
  },
  cryptoList: [{
    coin: "BTC",
    currency: "USDT",
    average: 15
  }]
};

function createConfigFile() {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), "utf-8");
  }
}

/**
 * Loads the config.json file. If it doesn't exist, it creates a new one with default values.
 * @returns {object} Parsed JSON configuration
 */
function loadConfigFile() {
  if (!fs.existsSync(configFile)) {
    createConfigFile();
  }

  try {
    const data = fs.readFileSync(configFile, "utf-8");
    var jsonData = JSON.parse(data);
    
    if (!jsonData.version || jsonData.version !== defaultConfig.version) {
        fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), "utf-8");
        return defaultConfig;
    }
    return jsonData;
  } catch (error) {
    console.error("Error loading config file:", error);
    return defaultConfig;
  }
}

/**
 * Updates the config.json file.
 * @param {object} config - The configuration object to save.
 */
function updateConfigFile(config) {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
}

/**
 * Opens the config.json file in the default text editor.
 */
function openConfigFile() {
    createConfigFile()
    shell.openPath(configFile).then((error) => {
        if (error) {
            console.error("Failed to open config file:", error);
        }
    });
}

module.exports = { createConfigFile, loadConfigFile, openConfigFile, updateConfigFile };
