
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
      players.seed = i;
    }
  } else { // Seeding by Elo
    for (let player of players) { // If player has no elo, treat them as if they have an elo of 0
      if (player.elo == null) {
        player.elo = 0;
      }
    }
    players.sort((a, b) => b.elo - a.elo); // Sort by elo in descending order.
    for (let i = 1; i <= players.length; i++) { // Assign seeds
      players.seed = i;
    }
  }
  return players;
}

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


$(function() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get("id");

  const data = {
    tournamentID: id,
  };

  $.post('/tournament/get-specific', data, function(response) {
    console.log(response);
    playersInTournament = response[1];
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
    const location = response.location;
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
    $('#tournament-location').text(location);
    $('#tournament-fees').html('Buy In: ' + buyIn + '<br>Greens Fee: ' + greensFee);
    $('#tournament-eloLimits').html(displayEloLimit);
    $('#tournament-isSeeded').text(displayIsSeeded);
    $('#tournament-placesPaid').text(placesPaid);

    seedPlayers(playersInTournament, isSeeded);
    buildBracket(bracketSize, playersInTournament);


  });
});