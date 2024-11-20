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
const { log } = require('console');
const server = http.createServer(app);

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});

// Serve index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/html/index.html');
});

// Serve home.html file
app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/public/html/home.html');
});

// Serve example.html file
app.get('/example', (req, res) => {
  res.sendFile(__dirname + '/public/html/example.html');
});

// Serve about.html file
app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/public/html/about.html');
});

// Serve contact.html file
app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/public/html/contact.html');
});

// Serve login.html file
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/html/login.html');
});

// Serve createaccount.html file
app.get('/createaccount', (req, res) => {
  res.sendFile(__dirname + '/public/html/createaccount.html');
});

// Serve advancedPlayerSearch.html
app.get('/advancedPlayerSearch', (req, res) => {
  res.sendFile(__dirname + '/public/html/advancedPlayerSearch.html');
});

// Serve advancedTournamentSearch.html
app.get('/advancedTournamentSearch', (req, res) => {
  res.sendFile(__dirname + '/public/html/advancedTournamentSearch.html');
});

// Serve viewtournament.html
app.get('/tournament/view', (req, res) => {
  res.sendFile(__dirname + '/public/html/viewtournament.html');
});

// Serve dev.html (developer testing page)
app.get('/dev', (req, res) => {
  res.sendFile(__dirname + '/public/html/dev.html');
});

// Serve searchtournament.html
app.get('/tournament/search', (req, res) => {
  res.sendFile(__dirname + '/public/html/searchtournament.html');
});

function setDefaultNum(num, defaultNum) {
  if (isNaN(num) || num == null) {
    return defaultNum;
  }
  return num;
}

function setDefaultString(str, defaultStr) {
  if (str == null) {
    return defaultStr;
  }
  return str;
}

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

    if (result1.length === 0) {
      res.status(200).json('Invalid Email');
    }
    
    else {
      const returnEmailSQL = "SELECT playerID FROM Players WHERE email = ? and password = ?";
      
      db.query(returnEmailSQL, data, (err2, result2) => {
        if (err2) {
          console.error("Error selecting email with password: ", err2);
          res.status(500).json('Error');
          return;
        }

        if (result2.length === 0) {
          res.status(200).json('Incorrect Password');
        } else {
          res.status(200).json('Success,' + result2[0].playerID);
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
  const isActive = req.body.isActive; // 0 = before, 1 = active, 2 = ended

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
    res.status(200).json('Success,' + result.insertId);
  });
});

/* Get All Tournaments */
app.post('/tournament/search', (req, res) => {
  console.log(req.body.name);
  const data = ['%'+req.body.name+'%']
  data.name = setDefaultString(data.name, "");
  const selectTournamentSQL = "SELECT * FROM Tournaments WHERE name LIKE ?";

  db.query(selectTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error getting tournaments: ", err);
      res.status(500).json('Error');
      return;
    }
    console.log(result);
    res.status(200).json(result);
  });
});

/* Get Specific Tournament */
app.post('/tournament/get-specific', (req, res) => {
  const tournamentID = req.body.tournamentID;

  const data = [tournamentID];
  const selectTournamentSQL = "SELECT * FROM Tournaments WHERE tournamentID = ?";
  const selectPlayersInTournamentSQL = "SELECT seed, a.playerID, name, elo, numMatches FROM dbMain.PlayersInTournament a LEFT JOIN dbMain.Players b ON a.playerID = b.playerID WHERE a.tournamentID=?";
  const selectMatchesSQL = "SELECT playerOneID, playerTwoID, winnerID, numRound FROM Matches WHERE tournamentID = ?";

  db.query(selectTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error selecting tournament details: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.length === 0) {
      res.status(404).json('Tournament Does Not Exist');
      return;
    }

    db.query(selectPlayersInTournamentSQL, data, (err2, result2) => {
      if (err2) {
        console.error("Error selecting tournament players: ", err2);
        res.status(500).json('Error');
        return;
      }

      db.query(selectMatchesSQL, data, (err3, result3) => {
        if (err3) {
          console.error("Error selecting tournament matches: ", err3);
          res.status(500).json('Error');
          return;
        }
        returnData = [result[0], result2, result3];

        res.status(200).json(returnData);
      });
    });

  });
});

/* Mark match win in db */
app.post('/tournament/mark-win', (req, res) => {
  const tournamentID = req.body.tournamentID;
  const playerOneID = req.body.playerOneID;
  const playerTwoID = req.body.playerTwoID;
  const winnerID = req.body.winnerID;
  const numRound = req.body.numRound;
  const organizerID = req.body.organizerID;
  const orgPassword = req.body.password;
  const data = [tournamentID, playerOneID, playerTwoID, winnerID, numRound];
  const credentialData = [tournamentID, organizerID, orgPassword];

  // Check credentials
  const credentialSQL = "SELECT tournamentID FROM Tournaments JOIN Players ON Tournaments.organizerID = Players.playerID WHERE Tournaments.tournamentID = ? and Tournaments.organizerID = ? and Players.password = ?";

  db.query(credentialSQL, credentialData, (err1, result1) => {
    if (err1) {
      console.error("Error checking credentials during mark-win: ", err1);
      res.status(500).json('Error');
      return;
    }

    if (result1.length === 0) {
      res.status(200).json('Incorrect Password/Lacking Permissions');
      return;
    }

    // If we got here, then credentials are good, and the person making the request is the correct organizer for this tournament
    const insertMatch = "INSERT INTO Matches (tournamentID, playerOneID, playerTwoID, winnerID, numRound) VALUES (?,?,?,?,?)";

    db.query(insertMatch, data, (err2, result2) => {
      if (err2) {
        console.error("Error inserting new match win", err2);
        res.status(500).json("Error");
        return;
      }

      res.status(200).json("Success");
      return;
    });
  });

});

app.post('/tournament/update-seeds', (req, res) => {
  const credentials = req.body.credentials;
  const tournamentID = req.body.tournamentID;
  const playersInTournament = req.body.playersInTournament;


  // Check credentials
  const credentialSQL = "SELECT tournamentID FROM Tournaments JOIN Players ON Tournaments.organizerID = Players.playerID WHERE Tournaments.tournamentID = ? and Tournaments.organizerID = ? and Players.password = ?";
  const credentialData = [credentials.tournamentID, credentials.organizerID, credentials.password];

  db.query(credentialSQL, credentialData, (err1, result1) => {
    if (err1) {
      console.error("Error checking credentials during mark-win: ", err1);
      res.status(500).json('Error');
      return;
    }

    if (result1.length === 0) {
      res.status(200).json('Incorrect Password/Lacking Permissions');
      return;
    }

    // If we got here, then credentials are good, and the person making the request is the correct organizer for this tournament
    const updateSeedSQL = "UPDATE PlayersInTournament SET seed = ? WHERE tournamentID = ? and playerID = ?";
    for (let player of playersInTournament) {
      db.query(updateSeedSQL, [player.seed, credentials.tournamentID, player.playerID], (err2, result2) => {
        if (err2) {
          console.error("Error while updating player seeds", err2);
          return;
        }
      });
    }
  });
  
})

/* Register For Tournament */
app.post('/tournament/register', (req, res) => {
  const tournamentID = req.body.tournamentID;
  const playerID = req.body.playerID;
  const playerPassword = req.body.playerPassword;

  const data = [tournamentID, playerID, playerPassword];
  var playerElo; // The registering player's elo
  var tournamentSpots; // Number of spots in the tournament
  console.log(data);

  // Check if the player exists and save their elo
  const checkPlayerDetails = "SELECT * FROM Players WHERE PlayerID = ? and password = ?";
  db.query(checkPlayerDetails, [playerID, playerPassword], (err, result) => {
    if (err) {
      console.error("Error getting Players: ", err);
      res.status(500).json('Player Error');
      return;
    }

    if (result.length === 0) {
      res.status(200).json('Incorrect credentials');
      return;
    }
    // Player exists! Get elo
    playerElo = result[0].elo;

    // Player exists, now check the tournament details
    const checkTournamentDetails = "SELECT * FROM Tournaments WHERE TournamentID = ?";
    db.query(checkTournamentDetails, tournamentID, (err, result) => {
      if (err) {
        console.error("Error getting Tournaments: ", err);
        res.status(500).json('Tournament Error');
        return;
      }
  
      if (result.length === 0) {
        res.status(200).json('Tournament Does Not Exist');
        return;
      }

      if (result[0].isActive === 1) {
        res.status(200).json('Tournament Already Started');
        return;
      }

      if (result[0].isActive === 2) {
        res.status(200).json('Tournament Already Ended');
        return;
      }

      // Tournament exists and hasn't started yet. Get bracketSize
      tournamentSpots = result[0].bracketSize;
  
      if (playerElo < result[0].lowEloLimit || playerElo > result[0].highEloLimit) {
        res.status(200).json('Outside Elo Range');
        return;
      }
      
      // Check how many players are in the tournament
      const checkPlayersInTournament = "SELECT playerID FROM PlayersInTournament WHERE tournamentID = ?";
      db.query (checkPlayersInTournament, tournamentID, (err, result) => {
        if (err) {
          console.error("Error getting PlayersInTournament: ", err);
          res.status(500).json('PlayersInTournament Error');
          return;
        }

        if (result.length >= tournamentSpots) {
          res.status(200).json('Tournament Full');
          return;
        }
        // Check the PlayersInTournament table for duplicates
        const checkDuplicateEntry = "SELECT * FROM PlayersInTournament WHERE tournamentID = ? AND playerID = ?";
        db.query (checkDuplicateEntry, [tournamentID, playerID], (err, result) => {
          if (err) {
            console.error("Error getting PlayersInTournament: ", err);
            res.status(500).json('PlayersInTournament Error');
            return;
          }
      
          if (result.length > 0) {
            res.status(200).json('Already Registered');
            return;
          }
      
          // Finally, add the player into the tournament
          const registerTournamentSQL = "INSERT INTO PlayersInTournament (tournamentID, playerID, seed) VALUES (?, ?, null)";
          db.query(registerTournamentSQL, [tournamentID, playerID], (err, result) => {
            if (err) {
              console.error("Error getting PlayersInTournament: ", err);
              res.status(500).json('PlayersInTournament Error');
              return;
            }
            res.status(200).json('Success');
          });
        });
      });
    });
  });
});

/* Get Players In Tournament */
app.post('/tournament/get-players', (req, res) => {
  const tournamentID = req.body.tournamentID;

  const data = [tournamentID];
  const registerTournamentSQL = "SELECT * FROM PlayersInTournament WHERE tournamentID = ?";

  db.query(registerTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error getting players in tournament: ", err);
      res.status(500).json('Error');
      return;
    }

    res.status(200).json(result);
  });
});

/* Delete Tournament */
app.post('/tournament/delete', (req, res) => {
  const tournamentID = req.body.tournamentID;
  const organizerID = req.body.organizerID;

  const data = [tournamentID, organizerID];
  const deleteTournamentSQL = "DELETE FROM Tournaments WHERE tournamentID = ? and organizerID = ?";

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
app.post('/account/get', (req, res) => {
  let name = req.body.name;
  name = setDefaultString(name, "");
  let lowElo = parseInt(req.body.lowElo);
  lowElo = setDefaultNum(lowElo, 0);
  let highElo = parseInt(req.body.highElo);
  highElo = setDefaultNum(highElo, 9999);
  let lowNumMatches = parseInt(req.body.lowNumMatches);
  lowNumMatches = setDefaultNum(lowNumMatches, 0);
  let highNumMatches = parseInt(req.body.highNumMatches);
  highNumMatches = setDefaultNum(highNumMatches, 9999);

  const data = ['%'+name+'%', lowElo, highElo, lowNumMatches, highNumMatches];
  const selectAccountSQL = "SELECT playerID, name, elo, numMatches FROM Players WHERE name LIKE ? AND elo >= ? AND elo <= ? AND numMatches >= ? AND numMatches <= ?";

  console.log(data);

  db.query(selectAccountSQL, data, (err, result) => {
    if (err) {
      console.error("Error finding playerID: ", err);
      res.status(500).json('Error');
      return;
    }
    //console.log(result);

    if (result.length === 0) {
      res.status(404).json('No Matching Players');
      return;
    }

    res.status(200).json(result);
  });
});

/* Set Player ELO */
app.post('/account/elo/set', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const elo = parseInt(req.body.elo);

  const data = [email, password, elo];
  const checkPlayerSQL = "SELECT playerID FROM Players WHERE email = ? AND password = ?";
  const updateEloSQL = "UPDATE Players SET elo = ? WHERE playerID = ?";

  db.query(checkPlayerSQL, data.slice(0, 2), (err1, result1) => {
    if (err1) {
      console.error("Error finding playerID: ", err1);
      res.status(500).json('Error');
      return;
    }

    if (result1.length === 0) {
      res.status(404).json('Invalid credentials');
      return;
    }

    playerID = result1[0].playerID;

    db.query(updateEloSQL, [elo, playerID], (err2, result2) => {
      if (err2) {
        console.error("Error updating elo: ", err2);
        res.status(500).json('Error');
        return;
      }

      console.log(result2);

      res.status(200).json('Success');
    });
  });
});