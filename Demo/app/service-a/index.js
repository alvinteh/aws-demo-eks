const express = require('express');
const got = require('got');

const appName = 'Service A';
const appHost = process.env.APP_HOST || '0.0.0.0';
const appPort = process.env.APP_PORT || 3000;

const app = express();

app.get('/', (req, res) => {
  res.send(`Hello from ${appName}!`);
});

app.get('/b', async (req, res) => {
  try {
    const result = await got('http://ab3test-service-b/');
    res.send(result.body);
  }
  catch (error) {
    res.send('Uh oh! An error occured calling Service B');
  }
});

app.get('/c', async (req, res) => {
  try {
    const result = await got('http://ab3test-service-c/');
    res.send(result.body);
  }
  catch (error) {
    res.send('Uh oh! An error occured calling Service C');
  }
});

const server = app.listen(appPort, appHost, () => {
  console.log(`${appName} started`);
});