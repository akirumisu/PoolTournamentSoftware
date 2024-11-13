$(function() {
  $('#create-tournament-form').submit(function(event) {
    event.preventDefault();

    const data = {
      name: $('#create-tournament-name').val(),
      description: $('#create-tournament-description').val(),
      /*
      date: $('#date').val(),
      location: $('#location').val(),
      lowEloLimit: $('#lowEloLimit').val(),
      highEloLimit: $('#highEloLimit').val(),
      isRanked: $('#isRanked').val(),
      greensFee: $('#greensFee').val(),
      placesPaid: $('#placesPaid').val(),
      addedMoney: $('#addedMoney').val(),
      bracketSize: $('#bracketSize').val(),
      isSeeded: $('#isSeeded').val(),
      organizerID: 256,
      gamemode: $('#gamemode').val(),
      isActive: 1
      */
      date: '2012-12-12',
      location: 2,
      lowEloLimit: 50,
      highEloLimit: 150,
      isRanked: 0,
      greensFee: 6,
      placesPaid: 7,
      addedMoney: 8,
      bracketSize: 3,
      isSeeded: 0,
      organizerID: 11,
      gamemode: 12,
      isActive: 0
    };
    console.log(data);

    $.post('/tournament/create', data, function(response) {
      // Handle response
      console.log(response);
    });
  });
});