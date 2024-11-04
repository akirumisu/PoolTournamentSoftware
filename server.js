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
});

// Serve example.html file
app.get('/example', (req, res) => {
  res.sendFile(__dirname + '/public/html/example.html');
});

// Register an account using a name, email, and password
app.post('/account/register', (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  const data = [name, email, password];
  const checkDuplicateSQL = "SELECT playerID FROM players WHERE email = ?";

  db.query(checkDuplicateSQL, data, (err1, result1) => {
    if (err1) {
      console.error("Error selecting playerID: ", err1);
      res.status(500).json({error: "Error"});
      return;
    }

    if (result1.rows.length !== 0) {
      res.status(200).json({message: "Duplicate Email"});
      return;
    }
    
    else {
      const insertNewPlayerSQL = "INSERT INTO players (name, elo, numMatches, email, password, isPaid) VALUES (?, 100, 0, ?, ?, 0)";
      
      db.query(insertNewPlayerSQL, data, (err2, result2) => {
        if (err2) {
          console.error("Error inserting new player: ", err2);
          res.status(500).json({error: "Error"});
          return;
        }

        res.status(200).json({message: "Success"});
      });
    }
  });
});

// Login using an email and password
app.post('/account/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const data = [email, password];
  const findEmailSQL = "SELECT email FROM players WHERE email = ?"

  db.query(findEmailSQL, data, (err1, result1) => {
    if (err1) {
      console.error("Error selecting email: ", err1);
      res.status(500).json({error: "Error"});
      return;
    }

    if (result1.rows.length === 0) {
      res.status(200).json({message: "Invalid Email"});
    }
    
    else {
      const returnEmailSQL = "SELECT email FROM players WHERE email = ? and password = ?";
      
      db.query(returnEmailSQL, data, (err2, result2) => {
        if (err2) {
          console.error("Error selecting email with password: ", err2);
          res.status(500).json({error: "Error"});
          return;
        }

        if (result1.rows.length === 0) {
          res.status(200).json({message: "Incorrect Password"});
        } else {
          res.status(200).json({message: "Success"});
        }
      });
    }
  });
});

// Return elo from a specific playerID
app.post('/get/elo', (req, res) => {
  const playerID = req.body.playerID;
  const elo = parseInt(req.body.elo);

  const data = [playerID, elo];
  const selectEloSQL = "SELECT elo FROM players WHERE playerID = ?";

  db.query(selectEloSQL, data, (err, result) => {
    if (err) {
      console.error("Error selecting elo: ", err);
      res.status(500).json({error: "Error"});
      return;
    }

    if (result.rows.length === 0) {
      res.status(404).json({error: "Invalid playerID"});
      return;
    }

    res.status(200).json(result.rows.elo);
  });
});

// Update elo of a specific playerID
app.post('/update/elo', (req, res) => {
  const playerID = req.body.playerID;
  const elo = parseInt(req.body.elo);

  const data = [playerID, elo];
  const updateEloSQL = "UPDATE players SET elo = ? WHERE playerID = ?";

  db.query(updateEloSQL, data, (err, result) => {
    if (err) {
      console.error("Error updating elo: ", err);
      res.status(500).json({error: "Error"});
      return;
    }

    res.status(200).json({message: "Success"});
  });
});