const bunyan = require('bunyan');
const express = require('express');

const appName = 'Rap service v0.1.0';
const appHost = process.env.APP_HOST || '0.0.0.0';
const appPort = process.env.APP_PORT || 3000;

const app = express();
const log = bunyan.createLogger({ name: appName });

try {
  log.addStream({ level: 'info', stream: process.stdout });
}
catch (error) {
  console.log(`Logger initialization failed (${error.name}: ${error.message})`);
}

app.get('/', (req, res) => {
  const response = 'Eminem';

  log.info(`/: Responded with "${response}"`)
  res.send(response);
});

const server = app.listen(appPort, appHost, () => {
  log.info(`${appName} started`);
});
