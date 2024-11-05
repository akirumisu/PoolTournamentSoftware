// .env variables
require('dotenv').config()
// Use express to serve static files in the public directory
const express = require('express');
const app = express();
app.use(express.static('public', {extensions:['html']}));
// json + body parsing functionality
app.use(express.json());
app.use(express.urlencoded({extended: true}));

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

// Serve dev.html (developer testing page)
app.get('/dev', (req, res) => {
  res.sendFile(__dirname + '/public/html/dev.html');
});

/* Create Player Account */
app.post('/account/create', (req, res) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  const data = [email, name, password];
  const checkDuplicateSQL = "SELECT playerID FROM Players WHERE email = ?";

  db.query(checkDuplicateSQL, data, (err1, result1) => {
    if (err1) {
      console.error("Error selecting playerID: ", err1);
      res.status(500).json('Error');
      return;
    }

    if (result1.length !== 0) {
      res.status(200).json('Duplicate Email');
      return;
    }
    
    else {
      const insertNewPlayerSQL = "INSERT INTO Players (email, name, password, elo, numMatches, isPaid) VALUES (?, ?, ?, 100, 0, 0)";
      
      db.query(insertNewPlayerSQL, data, (err2, result2) => {
        if (err2) {
          console.error("Error inserting new player: ", err2);
          res.status(500).json('Error');
          return;
        }

        res.status(200).json('Success');
      });
    }
  });
});

/* Login To Player Account */
app.post('/account/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const data = [email, password];
  const findEmailSQL = "SELECT email FROM Players WHERE email = ?"

  db.query(findEmailSQL, data, (err1, result1) => {
    if (err1) {
      console.error("Error selecting email: ", err1);
      res.status(500).json('Error');
      return;
    }

    if (result1.rows.length === 0) {
      res.status(200).json('Invalid Email');
    }
    
    else {
      const returnEmailSQL = "SELECT email FROM Players WHERE email = ? and password = ?";
      
      db.query(returnEmailSQL, data, (err2, result2) => {
        if (err2) {
          console.error("Error selecting email with password: ", err2);
          res.status(500).json('Error');
          return;
        }

        if (result1.rows.length === 0) {
          res.status(200).json('Incorrect Password');
        } else {
          res.status(200).json('Success');
        }
      });
    }
  });
});

/* Delete Player Account */
app.post('/account/delete', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const data = [email, password];
  const findEmailSQL = "DELETE FROM Players WHERE email = ? and password = ?";

  db.query(findEmailSQL, data, (err, result) => {
    if (err) {
      console.error("Error deleting account: ", err);
      res.status(500).json('Error');
      return;
    }

    res.status(200).json('Success');
  });
});

/* Create Tournament */
app.post('/tournament/create', (req, res) => {
  const name = req.body.name;
  const description = req.body.description;
  const date = req.body.date;
  const location = req.body.location;
  const lowEloLimit = req.body.lowEloLimit;
  const highEloLimit = req.body.highEloLimit;
  const isRanked = req.body.isRanked;
  const greensFee = req.body.greensFee;
  const placesPaid = req.body.placesPaid;
  const addedMoney = req.body.addedMoney;
  const bracketSize = req.body.bracketSize;
  const isSeeded = req.body.isSeeded;
  const organizerID = req.body.organizerID;
  const gamemode = req.body.gamemode;
  const isActive = req.body.isActive;

  const data = [name, description, date, location, lowEloLimit,
                highEloLimit, isRanked, greensFee, placesPaid, addedMoney,
                bracketSize, isSeeded, organizerID, gamemode, isActive];
  const createTournamentSQL = "INSERT INTO Tournaments (name, description, date, location, lowEloLimit, highEloLimit, isRanked, greensFee, placesPaid, addedMoney, bracketSize, isSeeded, organizerID, gamemode, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(createTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error creating tournament: ", err);
      res.status(500).json('Error');
      return;
    }

    res.status(200).json('Success');
  });
});

/* Get Tournament */
app.post('/tournament/get', (req, res) => {
  const tournamentID = req.body.tournamentID;

  const data = [tournamentID];
  const selectTournamentSQL = "SELECT * FROM Tournament WHERE tournamentID = ?";

  db.query(selectTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error selecting tournament: ", err);
      res.status(500).json('Error');
      return;
    }

    res.status(200).json(result);
  });
});

/* Register For Tournament */
app.post('/tournament/register', (req, res) => {
  const tournamentID = req.body.tournamentID;
  const playerID = req.body.playerID;
  const seed = req.body.seed;

  const data = [tournamentID, playerID];
  const registerTournamentSQL = "INSERT INTO PlayersInTournament (tournamentID, playerID, seed) VALUES (?, ?, ?)";

  db.query(registerTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error registering for tournament: ", err);
      res.status(500).json('Error');
      return;
    }

    res.status(200).json('Success');
  });
});

/* Delete Tournament */
app.post('/tournament/delete', (req, res) => {
  const tournamentID = req.body.tournamentID;
  const organizerID = req.body.organizerID;

  const data = [tournamentID, organizerID];
  const deleteTournamentSQL = "DELETE FROM Tournament WHERE tournamentID = ? and organizerID = ?";

  db.query(deleteTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error deleting tournament: ", err);
      res.status(500).json('Error');
      return;
    }

    res.status(200).json('Success');
  });
});

/* Get Player ELO */
app.post('/account/elo/get', (req, res) => {
  const playerID = req.body.playerID;
  const elo = parseInt(req.body.elo);

  const data = [playerID, elo];
  const selectEloSQL = "SELECT elo FROM Players WHERE playerID = ?";

  db.query(selectEloSQL, data, (err, result) => {
    if (err) {
      console.error("Error selecting elo: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.rows.length === 0) {
      res.status(404).json('Invalid playerID');
      return;
    }

    res.status(200).json(result.rows.elo);
  });
});

/* Set Player ELO */
app.post('/account/elo/set', (req, res) => {
  const playerID = req.body.playerID;
  const elo = parseInt(req.body.elo);

  const data = [playerID, elo];
  const updateEloSQL = "UPDATE Players SET elo = ? WHERE playerID = ?";

  db.query(updateEloSQL, data, (err, result) => {
    if (err) {
      console.error("Error updating elo: ", err);
      res.status(500).json('Error');
      return;
    }

    res.status(200).json('Success');
  });
});