$(function() {
  const params = new URLSearchParams(document.location.search);
  const id = params.get("id");

  console.log("HELLOOOOOOOOOOOOO")

  const data = {
    tournamentID: id,
  };

  $.post('/tournament/get-specific', data, function(response) {
    console.log(response);
    if (response.isActive === 0) {
      //tournament hasn't started yet
    }
    if (response.isActive === 1) {
      //tournament is currently active
    }
    if (response.isActive === 2) {
      //tournament has ended
    }
  });
});