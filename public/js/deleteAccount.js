$(function() {
  // Attach event handler to submit form
  $('#delete-form').submit(function(event) {
      event.preventDefault();

      const data = {
          email: $('#delete-email').val(),
          password: $('#delete-password').val()
      };
      console.log(data);

      $.post('/account/delete', data, function(response) {
          // Handle response
          console.log(response);
      });
  });
});