$(function() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get("id");

  const data = {
    tournamentID: id,
  };

  $.post('/tournament/get-specific', data, function(response) {
    console.log(response);
    const name = response.name;
    const description = response.description;
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

    $('#tournament-name').text(name);
    $('#tournament-description').text(description);
  });
});