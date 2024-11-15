$(function() {
  $('#create-tournament-form').submit(function(event) {
    event.preventDefault();

    const data = {
      name: $('#create-tournament-name').val(),
      description: $('#create-tournament-description').val(),
      
      date: $('#create-tournament-date').val(),
      location: $('#create-tournament-location').val(),
      lowEloLimit: $('#create-tournament-lowEloLimit').val(),
      highEloLimit: $('#create-tournament-highEloLimit').val(),
      isRanked: $('#create-tournament-isRanked').prop('checked'),
      greensFee: $('#create-tournament-greensFee').val(),
      placesPaid: $('#create-tournament-placesPaid').val(),
      addedMoney: $('#create-tournament-addedMoney').val(),
      bracketSize: $('#create-tournament-bracketSize').val(),
      isSeeded: $('#create-tournament-isSeeded').prop('checked'),
      organizerID: localStorage.getItem("playerID"),
      gamemode: $('#create-tournament-gamemode').val(),
      isActive: 0
      
    };

    if (data.lowEloLimit == "") data.lowEloLimit = 0;
    if (data.highEloLimit == "") data.highEloLimit = 9999;
    if (data.greensFee == "") data.greensFee = 0;
    if (data.placesPaid == "") data.placesPaid = 0;
    if (data.addedMoney == "") data.addedMoney = 0;

    data.isRanked = (data.isRanked) ? 1 : 0;
    data.isSeeded = (data.isSeeded) ? 1 : 0;

    if (data.organizerID == null) {
      console.log("You must be logged in to create a tournament");
      window.location.href = "login";
    }

    $.post('/tournament/create', data, function(response) {
      // Handle response
      if (response.includes("Success")) {
        tournamentID = response.replace("Success,","");
        window.location.href = "tournament?id=" + tournamentID;
      } else {
        console.log("Failed to create tournament");
        console.log(response);
      }
    });
  });
});