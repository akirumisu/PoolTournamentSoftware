// .env variables
require('dotenv').config()
const readline = require('readline');
// Use express to serve static files in the public directory
const express = require('express');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Express session middleware
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || '0jerh0ihjrh80h4winu4wegjn4wegjn', // I don't feel like sending another .env file out
  resave: false,             // false for performance
  saveUninitialized: false,  // false for performance
  cookie: { secure: false }  // false bc HTTP
}));

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

// Start daily scheduled elo adjusting task
setInterval(updateElo, 86400000);

// Listen for commands on command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  switch (input.trim()) {
    case 'exit':
      rl.close();
      process.exit();
      break;
    case 'processElo':
      console.log("Updating elos!");
      updateElo();
      break;
    case 'updateElo':
      console.log("Updating elos!");
      updateElo();
      break;
  }
});

// Serve index.html file
app.get('/', (req, res) => {
  let isSignedIn = req.session.playerID ? true : false;
  let sessionPlayerId = req.session.playerID || null;

  res.render('index', {
    isSignedIn: isSignedIn,
    sessionPlayerId: sessionPlayerId
  });
});

// Serve about.html file
app.get('/about', (req, res) => {
  let isSignedIn = req.session.playerID ? true : false;
  let sessionPlayerId = req.session.playerID || null;

  res.render('about', {
    isSignedIn: isSignedIn,
    sessionPlayerId: sessionPlayerId
  });
});

// Serve login.html file
app.get('/login', (req, res) => {
  let isSignedIn = req.session.playerID ? true : false;
  let sessionPlayerId = req.session.playerID || null;

  res.render('login', {
    isSignedIn: isSignedIn,
    sessionPlayerId: sessionPlayerId
  });
});

// Serve createaccount.html file
app.get('/createaccount', (req, res) => {
  let isSignedIn = req.session.playerID ? true : false;
  let sessionPlayerId = req.session.playerID || null;

  res.render('createaccount', {
    isSignedIn: isSignedIn,
    sessionPlayerId: sessionPlayerId
  });
});

// Serve createtournament.html
app.get('/tournament/create', (req, res) => {
  let isSignedIn = req.session.playerID ? true : false;
  let sessionPlayerId = req.session.playerID || null;

  res.render('createtournament', {
    isSignedIn: isSignedIn,
    sessionPlayerId: sessionPlayerId
  });
});

// Serve searchTournament.html
app.get('/tournament/search', (req, res) => {
  let isSignedIn = req.session.playerID ? true : false;
  let sessionPlayerId = req.session.playerID || null;

  res.render('searchtournament', {
    isSignedIn: isSignedIn,
    sessionPlayerId: sessionPlayerId
  });
});

// Serve searchaccount.html
app.get('/account/search', (req, res) => {
  let isSignedIn = req.session.playerID ? true : false;
  let sessionPlayerId = req.session.playerID || null;

  res.render('searchaccount', {
    isSignedIn: isSignedIn,
    sessionPlayerId: sessionPlayerId
  });
});

// Serve viewTournament.html
app.get('/tournament/view', (req, res) => {
  res.render('viewtournament');
});

// Serve dev.html (developer testing page)
app.get('/dev', (req, res) => {
  res.render('dev');
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
        req.session.playerID = result2.insertId; // Set playerID in express session
        res.status(200).json("Success," + result2.insertId);
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
          req.session.playerID = result2[0].playerID; // Set playerID in express session
          res.status(200).json('Success,' + result2[0].playerID);
        }
      });
    }
  });
});

/* Logout Player Account */
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json('Error');
      return;
    }
    res.clearCookie('connect.sid'); // Clear express session cookies
    res.redirect('/');
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
  const buyIn = req.body.buyIn; //forgot about this one

  const playerID = [req.body.playerID];
  const selectPlayersSQL = "SELECT isPaid, isVerifiedOrganizer FROM Players WHERE playerID = ?";

  db.query(selectPlayersSQL, playerID, (err, result) => {
    if (err) {
      console.error("Error Selecting Players: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.length === 0) {
      res.status(200).json('No Matching Players');
      return;
    }

    if (result[0].isPaid !== 1) { // Free user
      if (bracketSize > 16) { // Free user entered paid only options
        res.status(200).json('Invalid Options');
        return
      }
    }

    if (result[0].isVerifiedOrganizer !== 1) { // Unverified user
      if (Number(isRanked) === 1) { // Unverified user entered verified only options
        res.status(200).json('Invalid Options');
        return
      }
    }
    // If everything is good, continue as normal

    const data = [name, description, date, location, lowEloLimit,
      highEloLimit, isRanked, greensFee, placesPaid, addedMoney,
      bracketSize, isSeeded, organizerID, gamemode, isActive, buyIn];
    const createTournamentSQL = "INSERT INTO Tournaments (name, description, date, location, lowEloLimit, highEloLimit, isRanked, greensFee, placesPaid, addedMoney, bracketSize, isSeeded, organizerID, gamemode, isActive, buyIn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(createTournamentSQL, data, (err, result) => {
      if (err) {
        console.error("Error creating tournament: ", err);
        res.status(500).json('Error');
        return;
      }
      res.status(200).json('Success,' + result.insertId);
    });
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

app.post('/tournament/withdraw', (req, res) => {
  const tournamentID = req.body.tournamentID;
  const playerID = req.body.playerID;
  const playerPassword = req.body.playerPassword;

  
  // Check if the player exists and save their elo
  const checkPlayerDetails = "SELECT * FROM Players WHERE PlayerID = ? and password = ?";
  db.query(checkPlayerDetails, [playerID, playerPassword], (err, result) => {
    if (err) {
      console.error("Error checking credentials: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.length === 0) {
      res.status(200).json('Incorrect credentials');
      return;
    }

    // Check if the player exists and save their elo
    const withdrawPlayerSQL = "DELETE FROM PlayersInTournament WHERE tournamentID = ? AND playerID = ?";
    db.query(withdrawPlayerSQL, [tournamentID, playerID], (err2, result) => {
      if (err2) {
        console.error("Error withdrawing player: ", err2);
        res.status(500).json('Error');
        return;
      }

      res.status(200).json('Success');

    });
  });
});

app.post('/tournament/start', (req, res) => {
  const tournamentID = req.body.tournamentID;
  const organizerID = req.body.organizerID;
  const orgPassword = req.body.orgPassword;

  const data = [tournamentID, organizerID, orgPassword];

  // Check credentials
  const credentialSQL = "SELECT tournamentID FROM Tournaments JOIN Players ON Tournaments.organizerID = Players.playerID WHERE Tournaments.tournamentID = ? and Tournaments.organizerID = ? and Players.password = ?";
  const startTournamentSQL = "UPDATE Tournaments SET isActive = 1 WHERE tournamentID = ?";

  db.query(credentialSQL, data, (err1, result1) => {
    if (err1) {
      console.error("Error checking credentials during mark-win: ", err1);
      res.status(500).json('Error');
      return;
    }

    if (result1.length === 0) {
      res.status(200).json('Incorrect Password/Lacking Permissions');
      return;
    }

    db.query(startTournamentSQL, tournamentID, (err2, result) => {
      if (err2) {
        console.error("Error starting tournament: ", err2);
        res.status(500).json('Error');
        return;
      }
  
      res.status(200).json("Success");
    });

  });



  
});

app.post('/tournament/get', (req, res) => {
  const name = req.body.name;
  const lowEloLimit = req.body.lowEloLimit;
  const highEloLimit = req.body.highEloLimit;
  const minIsRanked = req.body.minIsRanked;
  const maxIsRanked = req.body.maxIsRanked;
  const minGreensFee = req.body.minGreensFee;
  const maxGreensFee = req.body.maxGreensFee;
  const minBracketSize = req.body.minBracketSize;
  const maxBracketSize = req.body.maxBracketSize;
  const gamemode = req.body.gamemode;
  const minIsActive = req.body.minIsActive; // 0 = before, 1 = active, 2 = ended
  const maxIsActive = req.body.maxIsActive;

  const data = ['%'+name+'%', lowEloLimit, highEloLimit, minIsRanked, maxIsRanked, minGreensFee, maxGreensFee, minBracketSize, maxBracketSize, '%'+gamemode+'%', minIsActive, maxIsActive];
  const selectTournamentSQL = "SELECT tournamentID, name, description, date, location, lowEloLimit, highEloLimit, isRanked, greensFee, bracketSize, gamemode, isActive FROM Tournaments " +
  "WHERE name LIKE ? AND lowEloLimit >= ? AND highEloLimit <= ? AND isRanked >= ? AND isRanked <= ? AND greensFee >= ? AND greensFee <= ? AND bracketSize >= ? AND bracketSize <= ? AND gamemode LIKE ? AND isActive >= ? AND isActive <= ?";

  db.query(selectTournamentSQL, data, (err, result) => {
    if (err) {
      console.error("Error Selecting Tournaments: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.length === 0) {
      res.status(200).json('No Matching Tournaments');
      return;
    }

    res.status(200).json(result);
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

/* Get Accounts */
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

  db.query(selectAccountSQL, data, (err, result) => {
    if (err) {
      console.error("Error Selecting Players: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.length === 0) {
      res.status(200).json('No Matching Players');
      return;
    }

    res.status(200).json(result);
  });
});

app.post('/account/get/isPaid', (req, res) => {
  let playerID = req.body.playerID;

  const data = [playerID];
  const selectisPaidSQL = "SELECT isPaid FROM Players WHERE playerID = ?";

  db.query(selectisPaidSQL, data, (err, result) => {
    if (err) {
      console.error("Error Selecting Players: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.length === 0) {
      res.status(200).json('No Matching Players');
      return;
    }

    if (result[0].isPaid === 1) {
      res.status(200).json('Paid');
      return
    }

    res.status(200).json('Not Paid');
  });
});

app.post('/account/get/isVerifiedOrganizer', (req, res) => {
  let playerID = req.body.playerID;

  const data = [playerID];
  const selectisPaidSQL = "SELECT isVerifiedOrganizer FROM Players WHERE playerID = ?";

  db.query(selectisPaidSQL, data, (err, result) => {
    if (err) {
      console.error("Error Selecting Players: ", err);
      res.status(500).json('Error');
      return;
    }

    if (result.length === 0) {
      res.status(200).json('No Matching Players');
      return;
    }

    if (result[0].isVerifiedOrganizer === 1) {
      res.status(200).json('Verified');
      return
    }

    res.status(200).json('Not Verified');
  });
});

/* Set Account ELO */
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

async function updateElo() {
  const getMatchesSQL = "SELECT * FROM Matches m JOIN Tournaments t ON m.tournamentID = t.tournamentID WHERE t.isRanked = 1 and isEloCounted = 0;"

  db.query(getMatchesSQL, (err, result) => { // Get all matches
    if (err) {
      console.error("Error Selecting Matches: ", err);
      return;
    }

    console.log("Matches being processed: ", result.length);

    for (let match of result) { // Iterate through all matches
      const selectPlayerSQL = "SELECT playerID, elo, numMatches FROM Players WHERE playerID = ?";
      db.query(selectPlayerSQL, match.playerOneID, (err, playerOne) => { // Get playerOne from match
        if (err) {
          console.error("Error Selecting Players: ", err);
          return -1;
        }

        if (playerOne.length === 0) {
          console.error("No matching player for id: ", match.playerOneID);
          return -1;
        }

        db.query(selectPlayerSQL, match.playerTwoID, (err2, playerTwo) => { // Get playerTwo from match
          if (err2) {
            console.error("Error Selecting Players: ", err2);
            return -1;
          }

          if (playerTwo.length === 0) {
            console.error("No matching player for id: ", match.playerTwoID);
            return -1;
          }
          let winner = (match.playerOneID == match.winnerID) ? 1 : 2;
          playerOne = playerOne[0];
          playerTwo = playerTwo[0];
          let k = 30;
          // Now playerOne and playerTwo are in memory. Do elo calcs and set their elos
          let winProbabilityOne = 1 / (1 + Math.pow(10, (playerTwo.elo - playerOne.elo) / 200));

          let winProbabilityTwo = 1 / (1 + Math.pow(10, (playerOne.elo - playerTwo.elo) / 200));

          if (winner == 2) winner = 0;
          let newPlayerOneElo = Math.round( playerOne.elo + k * (winner - winProbabilityOne) );
          let newPlayerTwoElo = Math.round( playerTwo.elo + k * ((1- winner) - winProbabilityTwo) );

          const updateEloSQL = "UPDATE Players SET elo = ? WHERE playerID = ?"
          db.query(updateEloSQL, [newPlayerOneElo, playerOne.playerID], (eloErr, result1) => { // Set new playerOne elo
            if (eloErr) {
              console.error("Error updating playerOne elo: ", eloErr);
              return -1;
            }

            db.query(updateEloSQL, [newPlayerTwoElo, playerTwo.playerID], (eloErr2, result2) => { // Set new playerTwo elo
              if (eloErr2) {
                console.error("Error updating playerOne elo: " +  eloErr2);
                return -1;
              }
              const setMatchCounted = "UPDATE Matches SET isEloCounted = 1 WHERE matchID = ?";
              db.query(setMatchCounted, match.matchID, (matchErr, result3) => { // Update match isEloCounted
                winner = (winner == 0) ? 2 : 1;
                console.log("Player " + winner + " won.");
                console.log("PlayerOne starting elo " + playerOne.elo + ", playerTwo starting elo: " + playerTwo.elo);
                console.log("PlayerOne end elo " + newPlayerOneElo + ", playerTwo end elo: " + newPlayerTwoElo);
              }); // End updating match isEloCounted
  
            }); // End setting playerTwo

          }); // End setting playerOne

        }); // End selecting playerTwo

      }); // End selecting playerOne
    } // End looping through matches
  }); // End selecting matches
}

