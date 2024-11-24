$(function() {
  let playerID = localStorage.getItem("playerID");
  let isPaid = false;

  const playerData = {
    playerID: playerID
  };

  $.post('/account/get/isPaid', playerData, function(response) {
    if (response === 'Paid') {
      isPaid = true;
      $('#create-tournament-bracket-32').prop('disabled', false);
      $('#create-tournament-bracket-64').prop('disabled', false);
      $('#create-tournament-bracket-128').prop('disabled', false);
      $('#create-tournament-bracket-256').prop('disabled', false);
    } else if (response === 'Not Paid') {
      isPaid = false;
      $('#create-tournament-alert').text("32+ Sized Brackets Are Only For Paid Members");
      $('#create-tournament-alert').slideDown();
    } else if (response === 'No Matching Players') {
      $('#create-tournament-form').hide();
      $('#create-tournament-alert').text("Please Login Before Trying To Creating A Tournament!");
      $('#create-tournament-alert').slideDown();
    }
  });

  $('#elo-limit-options-checkbox').change(function() {
    if ($(this).is(":checked")) {
      $('#elo-limit-options').slideDown();
      $('#create-tournament-lowEloLimit').prop('disabled', false);
      $('#create-tournament-lowEloLimit').val(0);
      $('#create-tournament-highEloLimit').prop('disabled', false);
      $('#create-tournament-highEloLimit').val(defaultMax);
    } else {
      $('#elo-limit-options').slideUp();
      $('#create-tournament-lowEloLimit').prop('disabled', true);
      $('#create-tournament-highEloLimit').prop('disabled', true);
    }
  });

  $('#paid-tournament-options-checkbox').change(function() {
    if ($(this).is(":checked")) {
      $('#paid-tournament-options').slideDown();
      $('#create-tournament-greensFee').prop('disabled', false);
      $('#create-tournament-greensFee').val(0);
      $('#create-tournament-placesPaid').prop('disabled', false);
      $('#create-tournament-placesPaid').val(0);
    } else {
      $('#paid-tournament-options').slideUp();
      $('#create-tournament-greensFee').prop('disabled', true);
      $('#create-tournament-placesPaid').prop('disabled', true);
    }
  });

  $('#create-tournament-form').submit(function(event) {
    event.preventDefault();

    let name = $('#create-tournament-name').val();
    let description = $('#create-tournament-description').val() || "No Description";
    let date = $('#create-tournament-date').val();
    let location = $('#create-tournament-location').val();
    let lowEloLimit = $('#create-tournament-lowEloLimit').val() || 0;
    let highEloLimit = $('#create-tournament-highEloLimit').val() || 9999;
    let isRanked = ($('#create-tournament-isRanked').prop('checked')) ? 1 : 0;
    let greensFee = $('#create-tournament-greensFee').val() || 0;
    let placesPaid = $('#create-tournament-placesPaid').val() || 0;
    let bracketSize = $('input[name="create-tournament-bracket"]:checked').val();
    let organizerID = playerID;
    let isSeeded = ($('#create-tournament-isSeeded').prop('checked')) ? 1 : 0;
    let gamemode = $('input[name="create-tournament-gamemode"]:checked').val();

    if (organizerID === null) {
      alert("You must be logged in to create a tournament");
      window.location.href = "/login";
    } else {
      const data = {
        playerID: playerID,

        name: name,                 //*
        description: description,   //
        date: date,                 //*
        location: location,         //*
        lowEloLimit: lowEloLimit,   //
        highEloLimit: highEloLimit, //
        isRanked: isRanked,         //
        greensFee: greensFee,       //
        placesPaid: placesPaid,     //
        addedMoney: 0,              //NA
        bracketSize: bracketSize,   //*
        isSeeded: isSeeded,         //
        organizerID: organizerID,   //NA
        gamemode: gamemode,         //*
        isActive: 0                 //NA
      };
  
      $.post('/tournament/create', data, function(response) {
        if (response.includes("Success")) {
          tournamentID = response.replace("Success,","");
          window.location.href = "/tournament/view?id=" + tournamentID;
        } else if (response === "Invalid Options") {
          window.location.reload();
        }
        else {
          console.log("Failed to create tournament");
          console.log(response);
        }
      });
    }
  });
});