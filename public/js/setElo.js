$(function() {
  // Attach event handler to submit form
  $('#elo-set-form').submit(function(event) {
      event.preventDefault();

      const data = {
          email: $('#elo-set-email').val(),
          password: $('#elo-set-password').val(),
          elo: $('#elo-set-elo').val()
      };
      console.log(data);

      $.post('/account/elo/set', data, function(response) {
          // Handle response
          console.log(response);
      });
  });
});