// .env variables
require('dotenv').config()
// Use express to serve static files
const express = require('express');
const app = express();
app.use(express.static('public', {extensions:['html']}));

var HOST = process.env.HOST;
var PORT = process.env.PORT;

// mySQL database
const mysql = require('mysql');
const db = mysql.createConnection({
  host     : process.env.DBHOST,
  user     : process.env.DBUSER,
  password : process.env.DBPASSWORD,
  database : process.env.DBDATABASE
});

// Create a server
const http = require('http');
const server = http.createServer(app);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});

// Serve index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
  res.statusCode = 200;
});

// Serve example.html file
app.get('/example', (req, res) => {
  res.sendFile(__dirname + '/public/html/example.html');
  res.statusCode = 200;
});