$(function() {
  // Attach event handler to submit form
  $('#get-tournament-players-form').submit(function(event) {
      event.preventDefault();

      const data = {
          tournamentID: $('#tournament-players-tournamentID').val(),
      };
      console.log(data);

      $.post('/tournament/get-players', data, function(response) {
          // Handle response
          console.log(response);
      });
  });
});