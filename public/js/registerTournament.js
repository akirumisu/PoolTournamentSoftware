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
            console.log(response);
            if (response === 'Player Does Not Exist') {
                //add code here
            }
            if (response === 'Tournament Does Not Exist') {
                //add code here
            }
            if (response === 'Tournament Already Started') {
                //add code here
            }
            if (response === 'Tournament Already Ended') {
                //add code here
            }
            if (response === 'Tournament Full') {
                //add code here
            }
            if (response === 'Outside Elo Range') {
                //add code here
            }
            if (response === 'Already Registered') {
                //add code here
            }
            if (response === 'Success') {
                //add code here
            }
        });
    });
});