$(function() {
    // Attach event handler to submit form
    $('#register-tournament-form').submit(function(event) {
        event.preventDefault();

        const data = {
            tournamentID: $('#register-tournament-tournamentID').val(),
            playerID: $('#register-tournament-playerID').val(),
        };
        console.log(data);

        $.post('/tournament/register', data, function(response) {
            // Handle response
            console.log(response);
        });
    });
});