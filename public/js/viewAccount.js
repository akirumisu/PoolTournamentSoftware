$(function() {
  // Attach event handler to submit form
  $('#account-get-form').submit(function(event) {
      event.preventDefault();

      const data = {
          name: $('#account-get-name').val(),
          lowElo: $('#account-get-low-elo').val(),
          highElo: $('#account-get-high-elo').val(),
          lowNumMatches: $('#account-get-low-numMatches').val(),
          highNumMatches: $('#account-get-high-numMatches').val()
      };
      console.log(data);

      $.post('/account/get', data, function(response) {
          // Handle response
          console.log(response);
      });
  });
});