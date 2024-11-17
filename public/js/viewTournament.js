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
    const name = response.name;
    displayName = (response.isRanked == 1) ? name + "(Ranked)" : name + " (Unranked)";
    displayName = displayName + " " + playersInTournament.length + "/" + response.bracketSize;
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
    const bracketSize = response.bracketSize;
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
    const isSeeded = (response.isSeeded == 1) ? "By Elo" : "Random";
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
    $('#tournament-isSeeded').text(isSeeded);
    $('#tournament-placesPaid').text(placesPaid);
  });
});