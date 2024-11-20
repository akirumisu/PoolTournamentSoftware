
// Randomizes player array for random seeding
function shufflePlayers(players) { // Fisher-Yates Shuffle
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  return players;
}

// Take players registered for tournament and add them to bracket according to seeding
function seedPlayers(players, isSeeded) {
  if (!isSeeded) { // Random seeding
    players = shufflePlayers(players);
    for (let i = 1; i <= players.length; i++) { // Randomize, then assign seeds by array order
      players[i-1].seed = i;
    }
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

// Calculates bracket seeds, so we know where to place players
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

function setWinner(credentials, playersInTournament, allPlayerGridIds, completedMatches, winnerButtonId, isByeWin = false) {
  let buttonParentId = winnerButtonId.replace("button","bracket");
  let winnerGridIdIndex = -1;
  let newGridId = -1;
  let roundLevel = -1;
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
  let winner = new Object;
  if (isByeWin < 3) { // isByeWin represents which player was a bye. Less than 3 means atleast one player is real, and we already have the winner, so they are guaranteed to be real
    winner = playersInTournament.find(player => player.gridId == allPlayerGridIds[roundLevel][winnerGridIdIndex])
    winner.gridId = newGridId;
  }

  // Win is now shown locally. Update db to hold win
  if (!isByeWin) { // isByeWin is only ever false when there are no byes at all or when advancing a match that has already been uploaded to db
    
    let loser = playersInTournament.find(player => player.gridId == allPlayerGridIds[roundLevel][loserGridIdIndex])
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

      if (playerOneDivContent.includes(" Bye <button")) { // P1 is Bye

        if (playerTwoDivContent.includes(" Bye <button")) { // Both P1 and P2 are Byes, let P1 advance
          let winnerButtonId = playerOneDivContent.match(buttonIdRegex);
          if (winnerButtonId.length > 0) {
            winnerButtonId = winnerButtonId[0];
            setWinner(-1, playersInTournament, allPlayerGridIds, [], winnerButtonId, 3);
          }
        
        } else { // P2 is real, P1 is Bye. Advance P2
          let winnerButtonId = playerTwoDivContent.match(buttonIdRegex);
          if (winnerButtonId.length > 0) {
            winnerButtonId = winnerButtonId[0];
            setWinner(-1, playersInTournament, allPlayerGridIds, [], winnerButtonId, 1);
          }
        }
        
      } else if (playerTwoDivContent.includes(" Bye <button")) { // P1 is real, P2 is a Bye. Advance P1
        let winnerButtonId = playerOneDivContent.match(buttonIdRegex);
        if (winnerButtonId.length > 0) {
          winnerButtonId = winnerButtonId[0];
          setWinner(-1, playersInTournament, allPlayerGridIds, [], winnerButtonId, 2);
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
    setWinner([], playersInTournament, allPlayerGridIds, completedMatches, winnerButtonId, false);
  }
  
}

function findPlayerSeed(divContent) {
  const match = divContent.match(/^<span>(\d+)/);

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

$(function() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get("id");

  const data = {
    tournamentID: id,
  };

  organizerID = localStorage.getItem('playerID');
  if (organizerID == null) organizerID = -1;
  password = localStorage.getItem('password');
  let credentials = {
    tournamentID: data.tournamentID,
    organizerID: organizerID,
    password: password
  }

  $.post('/tournament/get-specific', data, function(response) {
    playersInTournament = response[1];
    completedMatches = response[2];
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
    const isSeeded = response.isSeeded;
    const displayIsSeeded = (isSeeded == 1) ? "By Elo" : "Random";
    const isActive = response.isActive;

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

    if (playersInTournament.some(player => player.seed == null || player.seed < 1)) { // Only seed if it hasn't been done already
      console.log("Seeding players...");
      playersInTournament = seedPlayers(playersInTournament, isSeeded);
      updateSeeds(credentials, playersInTournament);
    }
    let bracketSpots = buildBracket(bracketSize, playersInTournament);

    // Building empty html bracket
    let n = Math.ceil(Math.log2(bracketSize));
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
    let allPlayerGridIds = [];

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
      const gridContent = `<span>${seed} ${player.name} <button id="${buttonId}" class="tournament-bracket-win-button">Win</button>`;
      $(`#${gridId}`).append(gridContent);
      player.gridId = gridId;
    }

    $('.tournament-bracket-container').on('click', '.tournament-bracket-win-button', function(event) {
      newGridId = setWinner(credentials, playersInTournament, allPlayerGridIds, completedMatches, event.target.id, false);
    });
    if (isActive) {
      updateByeWins(playersInTournament, allPlayerGridIds);
      advanceCompletedMatches(playersInTournament, allPlayerGridIds, completedMatches);
    }
    if (isActive == 0) {
      $('#tournament-register-button').removeClass("hidden");
      $('#tournament-register-button').on('click', function(event) {
        let data = {
          tournamentID: credentials.tournamentID,
          playerID: credentials.organizerID,
          playerPassword: credentials.password
        }
        $.post('/tournament/register', data, function(response) {
          location.reload();
        });
      });
    }
    
  });
});

