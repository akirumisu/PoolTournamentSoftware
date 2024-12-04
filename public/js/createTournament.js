$(async function() {
  const fetchSessionData = async () => {
    return await $.get('/api/session');
  };

  const session = await fetchSessionData(); // waits for this async function to finish before continuing

  let playerID = session.playerID; //localStorage.getItem("playerID");

  const playerData = {
    playerID: playerID
  };

  $.post('/account/get/isPaid', playerData, function(response) {
    if (response === 'Paid') {
      $('#create-tournament-bracket-32').prop('disabled', false);
      $('#create-tournament-bracket-64').prop('disabled', false);
      $('#create-tournament-bracket-128').prop('disabled', false);
      $('#create-tournament-bracket-256').prop('disabled', false);
      $('.paid-bracket-option').css("color", "black");
    } else if (response === 'Not Paid') {
      $('#create-tournament-bracket-alert').html('32+ Sized Brackets Are Only For <a href="/membership" class="alert-link">Premium Members</a>');
      $('#create-tournament-bracket-alert').slideDown();
    } else if (response === 'No Matching Players') {
      $('#create-tournament-form').hide();
      $('#create-tournament-alert').text("Please Login Before Trying To Creating A Tournament!");
      $('#create-tournament-alert').slideDown();
    }
  });

  $.post('/account/get/isVerifiedOrganizer', playerData, function(response) {
    if (response ===  'Verified') {
      $('#create-tournament-isRanked').prop('disabled', false);
      $('#verified-ranked-option').css("color", "black");
    } else if (response === 'No Matching Players') { }
    else {
      $('#create-tournament-ranked-alert').text("Ranked Tournaments Are Only For Verified Organizers");
      $('#create-tournament-ranked-alert').slideDown();
    }
  });

  $('#elo-limit-options-checkbox').change(function() {
    if ($(this).is(":checked")) {
      //$('#elo-limit-options').slideDown();
      $('.elo-limit-options-label').css("color", "black");
      $('#create-tournament-lowEloLimit').prop('disabled', false);
      $('#create-tournament-lowEloLimit').val(0);
      $('#create-tournament-highEloLimit').prop('disabled', false);
      $('#create-tournament-highEloLimit').val(defaultMax);
    } else {
      //$('#elo-limit-options').slideUp();
      $('.elo-limit-options-label').css("color", "gray");
      $('#create-tournament-lowEloLimit').prop('disabled', true);
      $('#create-tournament-highEloLimit').prop('disabled', true);
    }
  });

  $('#paid-tournament-options-checkbox').change(function() {
    if ($(this).is(":checked")) {
      //$('#paid-tournament-options').slideDown();
      $('.paid-tournament-options-label').css("color", "black");
      $('#create-tournament-buyIn').prop('disabled', false);
      $('#create-tournament-buyIn').val(0);
      $('#create-tournament-greensFee').prop('disabled', false);
      $('#create-tournament-greensFee').val(0);
      $('#create-tournament-placesPaid').prop('disabled', false);
      $('#create-tournament-placesPaid').val(0);
    } else {
      //$('#paid-tournament-options').slideUp();
      $('.paid-tournament-options-label').css("color", "gray");
      $('#create-tournament-buyIn').prop('disabled', true);
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
    let buyIn = $('#create-tournament-buyIn').val() || 0;

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
        isActive: 0,                //NA
        buyIn: buyIn                //
      };
  
      $.post('/tournament/create', data, function(response) {
        if (response.includes("Success")) {
          tournamentID = response.replace("Success,","");
          window.location.href = "/tournament/view?id=" + tournamentID;
        } else if (response === "Invalid Options") { // this happens if the user tries bypassing free or unverified restrictions
          alert("Uh oh, something went wrong. Please try creating a tournament again. If this problem persists, contact our support team.");
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