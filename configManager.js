const { shell } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const appName = "CryptoWidget";
const configDir = path.join(os.homedir(), "Documents", appName);
const configFile = path.join(configDir, "config.json");

const defaultConfig = {
    cryptoList: [{
      symbol: "BTCUSDT",
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
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading config file:", error);
    return defaultConfig;
  }
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

module.exports = { createConfigFile, loadConfigFile, openConfigFile };
