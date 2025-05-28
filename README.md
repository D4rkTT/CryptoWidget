# <img width="32px" height="32px" src="cw.png" align="center"> CryptoWidget

A lightweight cryptocurrency widget that displays real-time prices and provides trading recommendations based on bid and ask analysis.

<p align="center"><img align="center" src="screenshot.png"></p>

## Features
- Real-time price updates for selected cryptocurrencies.
- Trading suggestions derived from bid and ask data.
- Simple and modern user-friendly interface.

## Changelog:
- **Design**: Updated to a more compact and streamlined interface.
- **Settings Window**: Added a new settings interface that lets you customize the application’s position and manage coins (add, remove, update, and reorder).
- **Mobility**: You can now set the widget position via the config or settings (top-right, top-left, bottom-right, bottom-left) or enable "Toggle Move" from the tray icon to freely reposition the widget on screen. Once disabled, the new position is saved automatically.
- **Customization**: The configuration now allows you to specify the target cryptocurrency and the conversion currency independently.
- **Improvements**: Includes numerous bug fixes and overall code optimization.

## Installation
1. Download prebuilt installer from [Releases](https://github.com/D4rkTT/CryptoWidget/releases)
2. Install it
3. Customize the widget through the settings menu (open it from tray icon) or through the config file on "C:\Users\<username>\Documents\CryptoWidget\config.json"

## Build
1. Clone the repository:
   ```sh
   git clone https://github.com/D4rkTT/CryptoWidget.git
   ```
2. Navigate to the project directory:
   ```sh
   cd CryptoWidget
   ```
3. Install dependencies (if applicable):
   ```sh
   npm install
   ```
4. Build the widget:
   ```sh
   npm dist
   ```
5. Install the widget:
   from `dist` folder

## Usage
- Open the application to view real-time cryptocurrency prices.
- Use the provided trading recommendations to make informed decisions.

## Contributing
Contributions are welcome! Feel free to submit issues or pull requests.

## License
This project is licensed under the [MIT License](LICENSE).

