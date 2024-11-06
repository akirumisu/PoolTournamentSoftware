$(function() {
  $('#delete-tournament-form').submit(function(event) {
    event.preventDefault();

    const data = {
      tournamentID: $('#delete-tournament-tournamentID').val(),
      organizerID: 11
    };
    console.log(data);

    $.post('/tournament/delete', data, function(response) {
      // Handle response
      console.log(response);
    });
  });
});