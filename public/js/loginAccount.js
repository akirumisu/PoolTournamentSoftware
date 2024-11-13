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
          if (response.includes("Success")) {
            console.log("Successfully verified login credentials. Storing...");
            localStorage.setItem("email", data.email);
            localStorage.setItem("password", data.password);
            playerID = parseInt(response.replace("Success,",""));
            localStorage.setItem("playerID", playerID);
          }
          console.log(response);
      });
  });
});