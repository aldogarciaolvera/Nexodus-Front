const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, 'VERSION');
let appVersion = '0.0.2';

if (fs.existsSync(versionFilePath)) {
  appVersion = fs.readFileSync(versionFilePath, 'utf-8').trim();
}

module.exports = ({ config }) => {
  return {
    ...config,
    version: appVersion,
  };
};
