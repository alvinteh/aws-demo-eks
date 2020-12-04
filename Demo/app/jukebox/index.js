const bunyan = require('bunyan');
const express = require('express');
const got = require('got');

const appName = 'Jukebox service';
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
  res.send(`${appName} is up!`);
});

app.get('/rap', async (req, res) => {
  let result = '';

  try {
    result = (await got('http://ab3test-service-rap-v1')).body;
  }
  catch (error) {
    result = `Uh oh! An error occured calling rap (${error.name}: ${error.message})`;
  }
  
  log.info(`/rap: Responded with "${result}"`)
  res.send(result);
});

app.get('/rock', async (req, res) => {
  let result = '';

  try {
    result = (await got('http://ab3test-service-rock-v1')).body;
  }
  catch (error) {
    result = `Uh oh! An error occured calling rock (${error.name}: ${error.message})`;
  }
  
  log.info(`/rock: Responded with "${result}"`)
  res.send(result);
});

const server = app.listen(appPort, appHost, () => {
  log.info(`${appName} started`);
});
