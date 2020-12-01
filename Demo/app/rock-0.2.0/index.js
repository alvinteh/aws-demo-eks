const express = require('express');

const appName = 'Rock service v0.2.0';
const appHost = process.env.APP_HOST || '0.0.0.0';
const appPort = process.env.APP_PORT || 3000;

const app = express();

app.get('/', (req, res) => {
  const response = 'Bon Jovi';

  console.log(`/: Responded with "${response}"`)
  res.send(response);
});

const server = app.listen(appPort, appHost, () => {
  console.log(`${appName} started`);
});