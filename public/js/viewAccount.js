$(function() {
  // Attach event handler to submit form
  $('#account-get-form').submit(function(event) {
      event.preventDefault();

      const data = {
          email: $('#account-get-email').val(),
          password: $('#account-get-password').val()
      };
      console.log(data);

      $.post('/account/get', data, function(response) {
          // Handle response
          console.log(response);
      });
  });
});