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
      $('#account-get-row').empty(); # Empty the account list before repopulating.
      for (let el in response) {
        let player = response[el];
        // Using bootstrap columns, we include a length of 4. 12/4, This means every 3 tournaments is a new row.
        let column = $('<div class="col-lg-4"></div>');
        // HTML allows us to add formatting. You can edit the 'tournament' class in css or add more classes
        let itemHTML = '<div class="player">' +
          '<a href="/player?id=' + player.playerID + '"> <h4>' + player.name + '</h4> </a>' +
          '<p> elo: ' + player.elo + '<br>numMatches: ' + player.numMatches + '</p>' +
          '<br>' +
          '</div>';
        column.append(itemHTML);
        // By appending each tournament, this row will have several columns. Although it is 1 row element,
        // there will visually be multiple rows because only 3 columns can exist on each row
        console.log($('account-get-row'));
        $('#account-get-row').append(column);
      }

      console.log(response);
    });
  });
});