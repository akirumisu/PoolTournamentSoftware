$(function() {
  // Attach event handler to submit form
  $('#signup-form').submit(function(event) {
      event.preventDefault();

      const data = {
          email: $('#register-email').val(),
          name: $('#register-name').val(),
          password: $('#register-password').val()
      };
      console.log(data);

      $.post('/account/create', data, function(response) {
          // Handle response
          console.log(response);
      });
  });
});