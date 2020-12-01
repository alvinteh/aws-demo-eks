const express = require('express');
const got = require('got');

const appName = 'Jukebox service';
const appHost = process.env.APP_HOST || '0.0.0.0';
const appPort = process.env.APP_PORT || 3000;

const app = express();

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
  
  console.log(`/rap: Responded with "${result}"`)
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
  
  console.log(`/rock: Responded with "${result}"`)
  res.send(result);
});

const server = app.listen(appPort, appHost, () => {
  console.log(`${appName} started`);
});