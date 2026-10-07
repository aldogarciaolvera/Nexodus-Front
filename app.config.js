const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, 'VERSION');
let appVersion = '0.0.3';

if (fs.existsSync(versionFilePath)) {
  appVersion = fs.readFileSync(versionFilePath, 'utf-8').trim();
}

const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = ({ config }) => {
  return {
    ...config,
    version: appVersion,
    name: IS_DEV ? 'Nexodus_Develop' : config.name,
    ios: {
      ...config.ios,
      bundleIdentifier: IS_DEV ? `${config.ios?.bundleIdentifier || 'com.garciaolveraaldo.Nexodus'}.dev` : (config.ios?.bundleIdentifier || 'com.garciaolveraaldo.Nexodus'),
    },
    android: {
      ...config.android,
      package: IS_DEV ? `${config.android?.package}.dev` : config.android?.package,
    },
    plugins: [
      ...(config.plugins || []),
      "expo-image"
    ],
  };
};
