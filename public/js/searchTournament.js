$(function() {
  let defaultMin = 0;
  let defaultMax = Number.MAX_SAFE_INTEGER;

  let URLparams = new URLSearchParams(document.location.search);
  let URLname = URLparams.get("name");

  if (URLname) {
    $('#tournament-name').val(URLname);
  }

  $('#advanced-search-button').change(function() {
    if ($(this).is(":checked")) {
      $('#advanced-search-options').slideDown();

      $('#tournament-lowEloLimit').val(0);
      $('#tournament-lowEloLimit').prop('disabled', false);
      $('#tournament-highEloLimit').val(9999);
      $('#tournament-highEloLimit').prop('disabled', false);
      $('#tournament-minBracketSize').val(0);
      $('#tournament-minBracketSize').prop('disabled', false);
      $('#tournament-maxBracketSize').val(64);
      $('#tournament-maxBracketSize').prop('disabled', false);

      $('#tournament-isRanked-any').prop('checked', true).prop('disabled', false);
      $('#tournament-isRanked-no').prop('disabled', false);
      $('#tournament-isRanked-yes').prop('disabled', false);

      $('#tournament-greensFee-any').prop('checked', true).prop('disabled', false);
      $('#tournament-greensFee-no').prop('disabled', false);
      $('#tournament-greensFee-yes').prop('disabled', false);

      $('#tournament-gamemode-any').prop('checked', true).prop('disabled', false);
      $('#tournament-gamemode-single-elim').prop('disabled', false);
      $('#tournament-gamemode-chip').prop('disabled', false);

      $('#tournament-isActive-any').prop('checked', true).prop('disabled', false);
      $('#tournament-isActive-0').prop('disabled', false);
      $('#tournament-isActive-1').prop('disabled', false);
      $('#tournament-isActive-2').prop('disabled', false);
    }
    else {
      $('#advanced-search-options').slideUp();

      $('#tournament-lowEloLimit').prop('disabled', true);
      $('#tournament-highEloLimit').prop('disabled', true);
      $('#tournament-minBracketSize').prop('disabled', true);
      $('#tournament-maxBracketSize').prop('disabled', true);

      $('#tournament-isRanked-any').prop('disabled', true);
      $('#tournament-isRanked-no').prop('disabled', true);
      $('#tournament-isRanked-yes').prop('disabled', true);

      $('#tournament-greensFee-any').prop('disabled', true);
      $('#tournament-greensFee-no').prop('disabled', true);
      $('#tournament-greensFee-yes').prop('disabled', true);

      $('#tournament-gamemode-any').prop('disabled', true);
      $('#tournament-gamemode-single-elim').prop('disabled', true);
      $('#tournament-gamemode-chip').prop('disabled', true);

      $('#tournament-isActive-any').prop('disabled', true);
      $('#tournament-isActive-0').prop('disabled', true);
      $('#tournament-isActive-1').prop('disabled', true);
      $('#tournament-isActive-2').prop('disabled', true);
    }
  });

  $('#tournament-search-form').submit(function(event) {
    event.preventDefault();

    let eloMin = $('#tournament-lowEloLimit').val() || defaultMin;
    let eloMax = $('#tournament-highEloLimit').val() || defaultMax;
    let bracketMin = $('#tournament-minBracketSize').val() || defaultMin;
    let bracketMax = $('#tournament-maxBracketSize').val() || defaultMax;

    let isRankedSelectedVal = $('input[name="tournament-isRanked"]:checked').val() || "any";
    let minIsRanked;
    let maxIsRanked;
    if (isRankedSelectedVal === "any") {
      minIsRanked = 0;
      maxIsRanked = 1;
    } else {
      minIsRanked = isRankedSelectedVal;
      maxIsRanked = isRankedSelectedVal;
    }

    let greensFeeSelectedVal = $('input[name="tournament-greensFee"]:checked').val() || "any";
    let minGreensFee;
    let maxGreensFee;
    if (greensFeeSelectedVal === "any") {
      minGreensFee = defaultMin;
      maxGreensFee = defaultMax;
    } else if (greensFeeSelectedVal === "no") {
      minGreensFee = defaultMin;
      maxGreensFee = 0;
    } else if (greensFeeSelectedVal === "yes") {
      minGreensFee = 1;
      maxGreensFee = defaultMax;
    }

    let gamemodeSelected = $('input[name="tournament-gamemode"]:checked');
    let gamemode = gamemodeSelected.val() || "";

    let isActiveSelectedVal = $('input[name="tournament-isActive"]:checked').val() || "any";
    let minIsActive;
    let maxIsActive;
    if (isActiveSelectedVal === "any") {
      minIsActive = 0;
      maxIsActive = 2;
    } else {
      minIsActive = isActiveSelectedVal;
      maxIsActive = isActiveSelectedVal;
    }

    if ($('#advanced-search-options').is(":hidden")) {
      eloMin = defaultMin;
      eloMax = defaultMax;
      bracketMin = defaultMin;
      bracketMax = defaultMax;
      minIsRanked = 0;
      maxIsRanked = 1;
      minGreensFee = defaultMin;
      maxGreensFee = defaultMax;
      gamemode = "";
      minIsActive = 0;
      maxIsActive = 2;
    }

    const data = {
      name: $('#tournament-name').val(),
      lowEloLimit: eloMin,
      highEloLimit: eloMax,
      minBracketSize: bracketMin,
      maxBracketSize: bracketMax,
      minIsRanked: minIsRanked,
      maxIsRanked: maxIsRanked,
      minGreensFee: minGreensFee,
      maxGreensFee: maxGreensFee,
      gamemode: gamemode,
      minIsActive: minIsActive,
      maxIsActive: maxIsActive
    }

    if (data.name) {
      window.history.replaceState(null, '', "/tournament/search?name=" + encodeURIComponent(data.name));
    }

    $.post('/tournament/get', data, async function(response) {
      $('#tournament-view-row').empty();

      if (response === 'No Matching Tournaments') {
        $('#tournament-search-alert').text("No Matching Tournaments");
        $('#tournament-search-alert').slideDown();
      } else {
        $('#tournament-search-alert').hide();

        for (let el in response) {
          let t = response[el];

          let numOfPlayers;
          try {
            let getSpecificData = {
              tournamentID: t.tournamentID
            };
          
            const res = await $.post('/tournament/get-specific', getSpecificData);
            let playersInTournament = res[1];
            const bracketSize = res[0].bracketSize;
            numOfPlayers = playersInTournament.length + "/" + bracketSize;
          } catch (error) { } // don't mind the errors

          let statusName;
          let statusClass;
          if (t.isActive === 0) {
            statusName = "Not Started";
            statusClass = "status-1"
          } else if (t.isActive === 1) {
            statusName = "In-Progress";
            statusClass = "status-2"
          } else if (t.isActive === 2) {
            statusName = "Ended";
            statusClass = "status-3"
          }

          let gamemodeText = (t.gamemode === 'single-elim') ? "Single Elimination" : "Chip";

          let isoDate = t.date;
          let date = new Date(isoDate);
          let displayDate = date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZoneName: 'short'
          });

          let rankedText = (t.isRanked === 1) ? "(Ranked)" : "(Unranked)";

          let column = $('<div class="col-lg-4"></div>');
          let itemHTML = '<div class="card">' +
            '<a href="/tournament/view?id=' + t.tournamentID + '"> <h5 class="card-title">' + t.name + '</h5> </a>' +
            //'<div class="' + statusClass + '">' + statusName + ' ' + t.gamemode + '</div>' +
            '<div class="row tournament-card-header">' +
              '<div class="col-4 text-start ' + statusClass + '">' +
                statusName +
              '</div>' +
              '<div class="col-4">' +
                gamemodeText +
              '</div>' +
              '<div class="col-4 text-end">' +
                numOfPlayers +
              '</div>' +
            '</div>' +
            '<ul class="list-group">' +
              '<li class="list-group-item">' + t.description  + '</li>' +
              '<li class="list-group-item"> <b>Date:</b> ' + displayDate + '</li>' +
              '<li class="list-group-item"> <b>Location:</b> ' + t.location + '</li>' +
              '<li class="list-group-item">' +
                '<div class="row">' +
                  '<div class="col-6 text-start">' +
                    '<b>Elo Limit:</b> ' + t.lowEloLimit + '-' + t.highEloLimit +
                  '</div>' +
                  '<div class="col-6 text-end">' +
                    rankedText +
                  '</div>' +
                '</div>' +
              '</li>' +
            '</ul>' + 
          '</div><br>'
          column.append(itemHTML);
          column.hide();
          $('#tournament-view-row').append(column);
          column.slideDown(200, 'linear');
        }
      }
    });
  });
});