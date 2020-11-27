const express = require('express');

const appName = 'Service C';
const appHost = process.env.APP_HOST || '0.0.0.0';
const appPort = process.env.APP_PORT || 3000;

const app = express();

app.get('/', (req, res) => {
  res.send(`Hello from ${appName}!`);
});

const server = app.listen(appPort, appHost, () => {
  console.log(`${appName} started`);
});