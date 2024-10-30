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

db.connect(function(err) {
  if (err) throw err;
  console.log('db connected');
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

  const name = "Joe Smith";

  const sql = "INSERT INTO Players (name, elo, numMatches) VALUES (?, null, 0)"
  const data = [name];

  db.query(sql, data, (err, result) => {
    if (err) throw err;
    res.statusCode = 200;
    console.log("Result: " + result);
  });
});

// Serve example.html file
app.get('/example', (req, res) => {
  res.sendFile(__dirname + '/public/html/example.html');

  const name = "Joe Smith";

  const sql = "DELETE FROM Players WHERE name=?"
  const data = [name];

  db.query(sql, data, (err, result) => {
    if (err) throw err;
    res.statusCode = 200;
    console.log("Result: " + result);
  });
});