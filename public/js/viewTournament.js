
// Randomizes player array for random seeding
function shufflePlayers(players) { // Fisher-Yates Shuffle
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  for (let i = 1; i <= players.length; i++) { // Randomize, then assign seeds by array order
    players[i-1].seed = i;
  }
  return players;
}

// Take players registered for tournament and add them to bracket according to seeding
function seedPlayers(players, isSeeded) {
  if (!isSeeded) { // Random seeding
    players = shufflePlayers(players);
  } else { // Seeding by Elo
    for (let player of players) { // If player has no elo, treat them as if they have an elo of 0
      if (player.elo == null) {
        player.elo = 0;
      }
    }
    players.sort((a, b) => b.elo - a.elo); // Sort by elo in descending order.
    for (let i = 1; i <= players.length; i++) { // Assign seeds
      players[i-1].seed = i;
    }
  }
  return players;
}

// Calculates bracket seed locations, so we know where to place players of any seed
function buildBracket(bracketSize, players) {
  // Determine nearest power of two (rounded up) that fits bracketSize. Then, calculate seeds for every bracket spot.
  let n = Math.ceil(Math.log2(bracketSize));
  if (n < 3) { // Seeding algorithm can only do n>=3. Manually return n=1,2
    if (n == 2) {
      return [[1,4],[2,3]];
    } else if (n == 1) {
      return [[1,2]];
    }
    console.log("Something went wrong with bracket creation. Does the tournament have atleast 2 spots?");
    return;
  }

  const fullBracketSize = Math.pow(2,n);
  let firstRoundMatches = []; // Initialize array representing each match in the first round.
  let allSeeds = [];
  
  for (let i = 1; i <= fullBracketSize; i++) {
    allSeeds.push(i);
  }

  for (let i = 0; i < fullBracketSize/2; i++) {
    firstRoundMatches.push([allSeeds[i], allSeeds[fullBracketSize-i-1]]);
  }

  let bracketSpots = new Array(fullBracketSize/2).fill(-1); // Represents the firstRoundMatches in order from top-left to bottom-left then top-right to bottom-right of the bracket
  for (let i = 0; i < Math.pow(2,n-2); i++) {
    let reversedIndex = 0;
    
    // Reverse the bits of i
    for (let j = 0; j < n-2; j++) {
        if ((i >> j) & 1) {
            reversedIndex |= 1 << (n - 3 - j);
        }
    }
    reversedIndex = reversedIndex * 2;
    bracketSpots[reversedIndex] = firstRoundMatches.shift();
    bracketSpots[reversedIndex+1] = firstRoundMatches.pop();
  }
  return bracketSpots;
}
function setWinner(credentials, playersInTournament, allPlayerGridIds, completedMatches, winnerButtonId, tables, isByeWin = false, gamemode = "single-elim") {

  let numRound = 0;
  let winner = new Object;
  let loser = new Object;
  if (gamemode == "single-elim") {
    let buttonParentId = winnerButtonId.replace("button","bracket");
    let winnerGridIdIndex = -1;
    let newGridId = -1;
    roundLevel = -1;
    for (let i = 0; i < allPlayerGridIds.length; i++) {
      winnerGridIdIndex = allPlayerGridIds[i].findIndex(id => id == buttonParentId);
      if (winnerGridIdIndex != -1 && (i+1) < allPlayerGridIds.length) {
        newGridId = allPlayerGridIds[i+1][Math.floor(winnerGridIdIndex/2)];
        roundLevel = i;
        break;
      }
    }
    if (newGridId == -1) {
      console.log("No space found for winner. Have they won the tournament?");
      return;
    }
    let winnerDivContent = $(`#${buttonParentId}`).html();
    let loserGridIdIndex = (winnerGridIdIndex % 2) ? winnerGridIdIndex-1 : winnerGridIdIndex+1;
    let loserDivContent = $(`#${allPlayerGridIds[roundLevel][loserGridIdIndex]}`).html();
    if (loserDivContent === "") {
      console.log("Winner can't win unless they have a competitor!");
      return;
    }
    let newButtonId = newGridId.replace("bracket","button");

    let newDivContent = winnerDivContent.replace(winnerButtonId,newButtonId);
    $(`#${newGridId}`).html(newDivContent);
    
    if (isByeWin < 3) { // isByeWin represents which player was a bye. Less than 3 means atleast one player is real, and we already have the winner, so they are guaranteed to be real
      winner = playersInTournament.find(player => player.gridId == allPlayerGridIds[roundLevel][winnerGridIdIndex])
      winner.gridId = newGridId;
      if (isByeWin == 0) loser = playersInTournament.find(player => player.gridId == allPlayerGridIds[roundLevel][loserGridIdIndex])
    }
  } else if (gamemode == "chip") {
    // TODO: Implement chip winning. Make sure winner, loser, and numRound are populated
    // Decrement loser chip amount. Check if they have chips left.
    // Send loser back to queue. Send new player from front of queue to table
     // Check how many players have chips left. If only one, designate them as winner (use CSS bracket winner class)
    const regex = /bracket-table-(\d+)-(\d+)/;
    const match = winnerButtonId.match(regex)
    const tableNumber = match[1];
    const winningPlayer = match[2];
    const losingPlayer = (winningPlayer == 1) ? 2 : 1;
    if (tables[tableNumber-1] === undefined) return;
    winner = tables[tableNumber-1][winningPlayer-1];
    loser = tables[tableNumber-1][losingPlayer-1];
    loser.numChips = loser.numChips - 1;
    loser.seed = 999999;
    playersInTournament = playersInTournament.sort((a,b) => a.seed - b.seed);
    let queue = playersInTournament.filter(player => player.seed >= 1 && player.numChips > 0);
    for (let i = 0; i < queue.length; i++) {
      queue[i].seed = i+1;
    }
    let newPlayer = queue.shift();
    if (!newPlayer) {
      if (playersInTournament.filter(player => player.numChips > 0).length == 1) {
        $(`#bracket-table-${tableNumber}-1`).addClass("tournament-bracket-winner-item");
        $(`#bracket-table-${tableNumber}-2`).addClass("tournament-bracket-winner-item");
        tables[tableNumber-1][losingPlayer-1] = winner;
        updateSeeds(credentials,playersInTournament);
        $.post('/tournament/end', credentials, function(response) {
          location.reload();
        });
        return;
      }
      console.log("No players found in queue! Sending winner back to queue");
      tables[tableNumber-1].length = 0;
      winner.seed = 999999;
      playersInTournament = playersInTournament.sort((a,b) => a.seed - b.seed);
      queue = playersInTournament.filter(player => player.seed >= 1 && player.numChips > 0);
      for (let i = 0; i < queue.length; i++) {
        queue[i].seed = i+1;
      }
      newPlayer = queue.shift();
    } else {
      tables[tableNumber-1][losingPlayer-1] = newPlayer;
      newPlayer.seed = -tableNumber;
    }



    numRound = 0;
    updateSeeds(credentials, playersInTournament); // Update seeds (spot in list of tables)
    return;
  }

  // Win is now shown locally. Update db to hold win
  if (!isByeWin) { // isByeWin is only ever false when there are no byes at all or when advancing a match that has already been uploaded to db
    
    
    const data = {
      tournamentID: credentials.tournamentID,
      playerOneID: winner.playerID,
      playerTwoID: loser.playerID,
      winnerID: winner.playerID,
      numRound: roundLevel,
      organizerID: credentials.organizerID,
      password: credentials.password
    };

    $.post('/tournament/mark-win', data, function(response) {
      data = {
        tournamentID: data.tournamentID,
        playerOneID: data.playerOneID,
        playerTwoID: data.playerTwoID,
        winnerID: data.winnerID,
        numRound: data.numRound
      }
      completedMatches.push(data);
    });
  }

}

function updateByeWins(playersInTournament, allPlayerGridIds) {
  for (let i = 0; i < allPlayerGridIds.length - 1; i++) {
    for (let j = 0; j < allPlayerGridIds[i].length; j=j+2) {
      playerOneGridId = allPlayerGridIds[i][j];
      playerTwoGridId = allPlayerGridIds[i][j+1];
      let playerOneDivContent = $(`#${playerOneGridId}`).html();
      let playerTwoDivContent = $(`#${playerTwoGridId}`).html();
      buttonIdRegex = /button-\d+-\d+/;

      
      if (playerOneDivContent.includes(" Bye</div><div> <button")) { // P1 is Bye
        if (playerTwoDivContent.includes(" Bye</div><div> <button")) { // Both P1 and P2 are Byes, let P1 advance
          let winnerButtonId = playerOneDivContent.match(buttonIdRegex);
          if (winnerButtonId.length > 0) {
            winnerButtonId = winnerButtonId[0];
            setWinner(-1, playersInTournament, allPlayerGridIds, [], winnerButtonId, [], 3);
          }
        
        } else { // P2 is real, P1 is Bye. Advance P2
          let winnerButtonId = playerTwoDivContent.match(buttonIdRegex);
          if (winnerButtonId.length > 0) {
            winnerButtonId = winnerButtonId[0];
            setWinner(-1, playersInTournament, allPlayerGridIds, [], winnerButtonId, [], 1);
          }
        }
        
      } else if (playerTwoDivContent.includes(" Bye</div><div> <button")) { // P1 is real, P2 is a Bye. Advance P1
        let winnerButtonId = playerOneDivContent.match(buttonIdRegex);
        if (winnerButtonId.length > 0) {
          winnerButtonId = winnerButtonId[0];
          setWinner(-1, playersInTournament, allPlayerGridIds, [], winnerButtonId, [], 2);
        }
      }
    }
  }
}

function advanceCompletedMatches(playersInTournament, allPlayerGridIds, completedMatches) {

  const sortedMatches = completedMatches.sort((match1, match2) => match1.numRound - match2.numRound);
  for (let match of sortedMatches) {
    winner = playersInTournament.find(player => player.playerID == match.winnerID);
    winnerGridId = winner.gridId;
    winnerButtonId = winnerGridId.replace("bracket","button");
    setWinner([], playersInTournament, allPlayerGridIds, completedMatches, winnerButtonId, [], 3);
  }
  
}

function findPlayerSeed(divContent) {
  const match = divContent.match(/^<div>(\d+)/);

  if (match) {
      const seed = parseInt(match[1]);
      return seed;
  } else {
      console.log("No seed found in " + divContent);
      return -1;
  }
}

function updateSeeds(credentials, playersInTournament) {

  const data = {
    credentials: credentials,
    playersInTournament: playersInTournament
  }
  $.post('/tournament/update-seeds', data, function(response) {

  });
}

function updateQueue(playersInTournament) {

  // Clear queue
  for (let i = 0; i < playersInTournament.length; i++) {
    $(`#bracket-player-${i+1}`).empty();
  }

  playersInTournament.sort((a, b) => a.seed - b.seed);

  // Seeds equal to 0 should not exist. Negative seeds denote players on a table, so they will not be in queue.
  let queue = playersInTournament.filter(player => player.seed >= 1);
  for (let i = 0; i < queue.length; i++) {
    $(`#bracket-player-${i+1}`).html(queue[i].name + " " + queue[i].numChips);
  }
}

// Resets seeds and populates tables. ONLY USE AT TOURNAMENT STARTUP OR WHEN REROLLING TABLES
function populateTables(playersInTournament, numTables, tables, isReset = false) {
  if (isReset) {
    console.log("Shuffling players");
    playersInTournament = shufflePlayers(playersInTournament);
  }
  if (playersInTournament.some(player => player.seed < -numTables)) { // Looking for players assigned to tables that no longer exist
    playersInTournament = shufflePlayers(playersInTournament);
    console.log("Bad player placements! Rerolling")
  }
  
  // Use either the max number of tables or the max number of matches possible with how many players there are.
  let queue = playersInTournament.filter(player => player.seed >= 1 && player.numChips > 0);
  let possibleMatches = Math.min((Math.floor(queue.length / 2)), numTables);
  console.log(possibleMatches)
  tables.length = 0; // Reset tables array
  for (let i = 0; i < possibleMatches; i++) {
    let player1 = queue[i*2];
    player1.seed = -1 * (i+1);
    let player2 = queue[i*2 + 1];
    player2.seed = -1 * (i+1);
    tables.push([player1, player2]);
  }
  updateTables(tables, numTables);
}

// Updates tables in HTML
function updateTables(tables, numTables, isWinner=false) {

  // Clear tables
  for (let i = 0; i < numTables; i++) {
    $(`#bracket-table-${i+1}-1-name`).empty();
    $(`#bracket-table-${i+1}-2-name`).empty();
  }

  // Populate tables
  for(let i = 0; i < tables.length; i++) {
    if (tables[i].length == 2) {
      $(`#bracket-table-${i+1}-1-name`).html(tables[i][0].name + " " + tables[i][0].numChips); // Add player1
      $(`#bracket-table-${i+1}-2-name`).html(tables[i][1].name + " " + tables[i][1].numChips); // Add player2
    }
  }

  if (isWinner) {
    $(`#bracket-table-1-1`).addClass("tournament-bracket-winner-item"); // Add player1
    $(`#bracket-table-1-2`).addClass("tournament-bracket-winner-item"); // Add player2
  }
}

$(async function() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get("id");

  const data = {
    tournamentID: id,
  };

  const fetchSessionData = async () => {
    return await $.get('/api/session');
  };

  const session = await fetchSessionData(); // waits for this async function to finish before continuing

  let organizerID = session.playerID; //localStorage.getItem('playerID');
  if (organizerID == null) organizerID = -1;
  let password = session.password; //localStorage.getItem('password');

  let credentials = {
    tournamentID: data.tournamentID,
    organizerID: organizerID,
    password: password
  }

  $.post('/tournament/get-specific', data, function(response) {
    let playersInTournament = response[1];
    let completedMatches = response[2];
    response = response[0];
    const bracketSize = response.bracketSize;
    const name = response.name;
    let displayName = (response.isRanked == 1) ? name + "(Ranked)" : name + " (Unranked)";
    displayName = displayName + " " + playersInTournament.length + "/" + bracketSize;
    const description = response.description;
    const isoDate = response.date;
    const date = new Date(isoDate);
    const displayDate = date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    });
    const tournamentLocation = response.location;
    const gamemode = response.gamemode;
    const buyIn = (response.buyIn == null) ? "Free!" : response.buyIn.toFixed(2); // If null, set to zero.
    const greensFee = response.greensFee.toFixed(2);
    const lowEloLimit = response.lowEloLimit;
    const highEloLimit = response.highEloLimit;
    displayEloLimit = "";
    if (lowEloLimit == null || lowEloLimit == 0) { // No low limit
      if (highEloLimit == null || highEloLimit == 9999 || highEloLimit == 0) { // No high limit, no low limit
        displayEloLimit = "No Restrictions";
      } else { // High limit, no low limit
        displayEloLimit = "Below " + highEloLimit;
      }
    } else { // Low limit
      if (highEloLimit == null || highEloLimit == 9999 || highEloLimit == 0) { // No high limit, low limit
        displayEloLimit = "Above " + lowEloLimit;
      } else { // High limit and low limit
        displayEloLimit = lowEloLimit + " to " + highEloLimit + " (inclusive)";
      }
    }
    const placesPaid = response.placesPaid;
    let isSeeded = response.isSeeded;
    const displayIsSeeded = (isSeeded == 1) ? "By Elo" : "Random";
    const isActive = response.isActive;
    const tournamentOrganizerID = response.organizerID;
    let numTables = response.numTables;
    let numChips = response.numChips;
    let tables = [];

    if (isActive === 0) { //tournament hasn't started yet
      $('#tournament-status').text("Not Started").css({
        'color': 'white',
        'background-color': 'green'
      });
      // add register button if the user has not registered
      // add withdraw button if the user has registered
    }
    if (isActive === 1) { //tournament is currently active
      $('#tournament-status').text("Ongoing").css({
        'color': 'black',
        'background-color': 'yellow'
      });
    }
    if (isActive === 2) { //tournament has ended
      $('#tournament-status').text("Ended").css({
        'color': 'black',
        'background-color': 'red'
      });
    }

    $('#tournament-name').text(displayName);
    $('#tournament-description').text(description);
    $('#tournament-gamemode').text(gamemode);
    $('#tournament-date').text(displayDate);
    $('#tournament-location').text(tournamentLocation);
    $('#tournament-fees').html('Buy In: ' + buyIn + '<br>Greens Fee: ' + greensFee);
    $('#tournament-eloLimits').html(displayEloLimit);
    $('#tournament-isSeeded').text(displayIsSeeded);
    $('#tournament-placesPaid').text(placesPaid);

    if (playersInTournament.some(player => player.seed == null || player.seed == 0)) { // Only seed if it hasn't been done already
      console.log("Seeding players...");
      if (gamemode == "chip") {
        isSeeded = false;
      }
      playersInTournament = seedPlayers(playersInTournament, isSeeded);
      updateSeeds(credentials, playersInTournament);
    }
    let bracketSpots = buildBracket(bracketSize, playersInTournament);

    // Building empty html bracket
    let n = Math.ceil(Math.log2(bracketSize));

    let allPlayerGridIds = [];
    if (gamemode == "single-elim") { // Start single-elim bracket population
      let numColumns = n * 2 + 1;
      let numRows = Math.pow(2,n) - 1;
      const gridTemplate = `repeat(${numColumns}, 12em)`;

      // Update bracket container to this tournament's bracketSize
      $('#tournament-bracket').css('grid-template-columns', gridTemplate);
      for (let row = 1; row <= numRows; row++) {
        for (let col = 1; col <= numColumns; col++) {
          const id = `bracket-${col}-${row}`;
          const div = $('<div>').attr('id', id).addClass('tournament-bracket-empty-item').appendTo($('#tournament-bracket'));
        }
      }

      // Multi-dimensional array that holds the ids of the <div> elements that hold player names. The first array is for the first round, second array for second round, and so on.
      

      // Draw bracket
      for (let col = 1; col <= n; col++) {

        allPlayerGridIds.push([]);
        let shift = Math.pow(2,col-1);
        let modCheck = shift * 2;
        
        for (let row = 1; row <= numRows; row++) {
          let check = (row+shift) % modCheck;
          if (check == 0) { // Draw bracket
            $(`#bracket-${col}-${row}`).removeClass('tournament-bracket-empty-item').addClass('tournament-bracket-item');
            allPlayerGridIds[col-1].push(`bracket-${col}-${row}`);
          } else if (check <= shift/2 || check >= (modCheck-shift/2)) { // Add connecting lines between players
            $(`#bracket-${col}-${row}`).removeClass('tournament-bracket-empty-item').addClass('tournament-bracket-left-border-item');
          }
        }

        for (let row = 1; row <= numRows; row++) {
          let check = (row+shift) % modCheck;
          if (check == 0) { // Draw bracket
            $(`#bracket-${numColumns+1-col}-${row}`).removeClass('tournament-bracket-empty-item').addClass('tournament-bracket-item');
            allPlayerGridIds[col-1].push(`bracket-${numColumns+1-col}-${row}`);
          } else if (check <= shift/2 || check >= (modCheck-shift/2)) { // Add connecting lines between players
            $(`#bracket-${numColumns+1-col}-${row}`).removeClass('tournament-bracket-empty-item').addClass('tournament-bracket-right-border-item');
          }
        }
      } 
      $(`#bracket-${Math.ceil(numColumns/2)}-${Math.ceil(numRows/2)}`).removeClass('tournament-bracket-empty-item').addClass('tournament-bracket-winner-item');
      allPlayerGridIds.push([`bracket-${Math.ceil(numColumns/2)}-${Math.ceil(numRows/2)}`]);
      // End drawing bracket
      
      
      // Populate bracket
      for (let i = 0; i < allPlayerGridIds[0].length; i++) {
        let seed = bracketSpots[Math.floor(i/2)][i % 2];
        let player = new Object;
        player.name = "Bye"; // Set default name to Bye, for empty places
        for (let plyr of playersInTournament) {
          if (plyr.seed == seed) {
            player = plyr;
            if (player.name == "Bye") { // On the off-chance that someone is actually named Bye
              player.name = "Bye (Player)";
            }
            break;
          }
        }
        const gridId = allPlayerGridIds[0][i];
        const buttonId = gridId.replace('bracket', 'button');
        const gridContent = `<div>${seed} ${player.name}</div><div> <button id="${buttonId}" class="tournament-bracket-win-button">Win</button></div>`;
        $(`#${gridId}`).append(gridContent);
        player.gridId = gridId;
      }
    } else if (gamemode == "chip") { // End bracket population, start chip population

      const numColumns = 5;
      let numRows = 0;

      if (numTables % 2) { // Round numTables up to nearest even number, so we don't calculate rows as multiples of 1.5
        numRows = Math.max(3*(numTables+1), playersInTournament.length+3);
      } else {
        numRows = Math.max(3*numTables, playersInTournament.length+3);
      }

      const gridTemplate = `repeat(5, 12em)`; // 5 columns. First is player list, then with spaces, 2 columns for matches

      // Update bracket container to this tournament's bracketSize
      $('#tournament-bracket').css('grid-template-columns', gridTemplate);

      // Draw column 1 (List of players + options for starting chip count and numTables)
      let id = `bracket-numTables-div`;
      $('<div>').attr('id', id).addClass('tournament-bracket-numTables').css({'grid-column': 1, 'grid-row': 1}).appendTo($('#tournament-bracket'));
      $(`#${id}`).html("<span>Number of Tables</span><input id=\"tournament-bracket-numTables\" type=\"number\" value=\"" + numTables + "\" style=\"width: 3rem; text-align: center;\"></input>");

      // When user updates Number of Tables, send update-numTables POST request
      $(`#tournament-bracket-numTables`).on('change', function(event) {
        numTables = parseInt($(`#tournament-bracket-numTables`).val())
        if (numTables < 1) {
          location.reload();
          return;
        }
        populateTables(playersInTournament, numTables, tables, true);
        let data = {
          tournamentID: credentials.tournamentID,
          organizerID: credentials.organizerID,
          orgPassword: credentials.password,
          numTables: numTables
        }
        $.post('/tournament/update-numTables', data, function(response) {
          console.log(response);
          location.reload();
        });
      });

      id = `bracket-numChips`;
      $('<div>').attr('id', id).addClass('tournament-bracket-numChips').css({'grid-column': 1, 'grid-row': 2}).appendTo($('#tournament-bracket'));
      $(`#${id}`).html("<span>Chips Per Player</span><input id=\"tournament-bracket-numChips\" type=\"number\" value=\"" + numChips + "\" style=\"width: 3rem; text-align: center;\"></input>");
      
      // When user updates Chips Per Player, send update-numChips POST request
      $(`#tournament-bracket-numChips`).on('change', function(event) {
        if (parseInt($(`#tournament-bracket-numChips`).val()) < 1) {
          location.reload();
          return;
        }
        let data = {
          tournamentID: credentials.tournamentID,
          organizerID: credentials.organizerID,
          orgPassword: credentials.password,
          numChips: parseInt($(`#tournament-bracket-numChips`).val())
        }
        if (isActive == 0) {
          $.post('/tournament/update-numChips', data, function(response) {
            console.log(response);
            location.reload();
          });
        } else {
          console.log("You cannot change the chips per player after the tournament has started!");
        }
      });
      
      $('<div>').attr('id', "bracket-1-3").addClass('tournament-bracket-empty-item').css({'grid-column': 1, 'grid-row': 3}).appendTo($('#tournament-bracket'));
      for (let i = 0; i < playersInTournament.length; i++) {
        id = `bracket-player-${i+1}`;
        $('<div>').attr('id', id).addClass('tournament-bracket-item').css({'grid-column': 1, 'grid-row': i+4}).appendTo($('#tournament-bracket'));
      }

      // Create Tables in HTML
      for (let i = 0; i < numTables; i++) {
        const col = (i % 2) ? 5 : 3;
        const row = Math.floor(i/2)*3 + 1;

        // Spacer
        $('<div>').addClass('tournament-bracket-empty-item').css({'grid-column': col, 'grid-row': row, 'text-align': 'center'}).html(`Table ${i+1}`).appendTo($('#tournament-bracket'));

        // Player 1
        id = `bracket-table-${i+1}-1`; // Player 1 for table X
        $('<div>').attr('id', id).addClass('tournament-bracket-item').css({'grid-column': col, 'grid-row': row+1}).appendTo($('#tournament-bracket'));

        $('<div>').attr('id', `${id}-name`).appendTo($(`#${id}`));
        $('<div>').attr('id', `${id}-win-div`).html(`<button id="${id}-win-button" class="tournament-bracket-win-button">Win</button>`).appendTo($(`#${id}`));
        // Player 2
        id = `bracket-table-${i+1}-2`; // Player 2 for table X
        $('<div>').attr('id', id).addClass('tournament-bracket-item').css({'grid-column': col, 'grid-row': row+2}).appendTo($('#tournament-bracket'));

        $('<div>').attr('id', `${id}-name`).appendTo($(`#${id}`));
        $('<div>').attr('id', `${id}-win-div`).html(`<button id="${id}-win-button" class="tournament-bracket-win-button">Win</button>`).appendTo($(`#${id}`));
      }

      updateQueue(playersInTournament);

    } // End chip population

    if (credentials.organizerID == tournamentOrganizerID) {

      $('.tournament-admin-menu-button').removeClass("hidden");
      $('.tournament-admin-menu-button').on('click', function(event) {
        $('.tournament-admin-menu').toggleClass("active");
        event.stopPropagation();
      });

      if (isActive == 0) {
        $('#tournament-start-button').removeClass("hidden");
        $('#tournament-start-button').on('click', function(event) {
          let data = {
            tournamentID: credentials.tournamentID,
            organizerID: credentials.organizerID,
            orgPassword: credentials.password
          }
          $.post('/tournament/start', data, function(response) {
            if (gamemode == "chip") {
              for (let player of playersInTournament) {
                player.numChips = numChips;
              }
              populateTables(playersInTournament, numTables, tables, true);
              updateSeeds(credentials, playersInTournament);
              location.reload();
            } else {
              location.reload();
            }
          });
        });
      }
      // Activate win buttons with event listener
      if (gamemode == "single-elim") {
        $('.tournament-bracket-container').on('click', '.tournament-bracket-win-button', function(event) {
          if (isActive == 1) {
            newGridId = setWinner(credentials, playersInTournament, allPlayerGridIds, completedMatches, event.target.id, [], false, gamemode);
          } else {
            console.log("Tournament is not active!");
          }
        });
      } else {
        $('.tournament-bracket-container').on('click', '.tournament-bracket-win-button', function(event) {
          if (isActive == 1) {
            newGridId = setWinner(credentials, playersInTournament, [], [], event.target.id, tables, false, gamemode);
            updateTables(tables, numTables);
            updateQueue(playersInTournament);
          } else {
            console.log("Tournament is not active!")
          }
        });
      }
    }
    if (isActive) {
      if (gamemode == "single-elim") {
        updateByeWins(playersInTournament, allPlayerGridIds);
        advanceCompletedMatches(playersInTournament, allPlayerGridIds, completedMatches);
      } else { // If chip
        // Create tables array
        tables.splice(0, tables.length);
        let j = 0;
        for (let i = 1; i <= numTables; i++) {
          let playersOnTable = [];
          for (let player of playersInTournament) {
            if (player.seed == -i) {
              playersOnTable.push(player);
            }
          }
          tables.push(playersOnTable);
          j = j + 1;
        }
        tables.length = j+1;
        if (tables.length > numTables || tables.some(table => table.length != 2)) {
          console.log("reset");
          let playersRemaining = playersInTournament.filter(player => player.numChips > 0)
          if (playersRemaining.length == 1) { // If there is only one person with chips left, aka a winner
            tables = [[playersRemaining[0], playersRemaining[0]]];
            updateTables(tables, numTables, true);
          } else {
            populateTables(playersInTournament, numTables, tables, true);
          }
        } else {
          populateTables(playersInTournament, numTables, tables);
        }
        updateSeeds(credentials, playersInTournament);
        updateQueue(playersInTournament);
      }
    }
    if (isActive == 0) {
      $('#tournament-register-button').removeClass("hidden");
      if (playersInTournament.some(player => player.playerID == credentials.organizerID)) {
        $('#tournament-register-button').addClass("tournament-withdraw-button");
        $('#tournament-register-button').text("Click to withdraw");
      } else {
        $('#tournament-register-button').addClass("tournament-register-button");
        $('#tournament-register-button').text("Click to register");
      }
      $('.tournament-register-button').on('click', function(event) {
        let data = {
          tournamentID: credentials.tournamentID,
          playerID: credentials.organizerID,
          playerPassword: credentials.password
        }
        $.post('/tournament/register', data, function(response) {
          location.reload();
        });
      });
      $('.tournament-withdraw-button').on('click', function(event) {
        let data = {
          tournamentID: credentials.tournamentID,
          playerID: credentials.organizerID,
          playerPassword: credentials.password
        }
        $.post('/tournament/withdraw', data, function(response) {
          location.reload();
        });
      });
    }
    
  });
});

