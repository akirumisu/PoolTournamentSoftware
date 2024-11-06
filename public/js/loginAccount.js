$(function() {
  // Attach event handler to submit form
  $('#login-form').submit(function(event) {
      event.preventDefault();

      const data = {
          email: $('#login-email').val(),
          password: $('#login-password').val()
      };
      console.log(data);

      $.post('/account/login', data, function(response) {
          // Handle response
          console.log(response);
      });
  });
});