$(function() {
  let defaultMin = 0;
  let defaultMax = Number.MAX_SAFE_INTEGER;

  let URLparams = new URLSearchParams(document.location.search);
  let URLname = URLparams.get("name");

  if (URLname) {
    $('#player-name').val(URLname);
  }

  $('#advanced-search-button').change(function() {
    if ($(this).is(":checked")) {
      $('#advanced-search-options').slideDown();
      $('#player-eloMin').val(0);
      $('#player-eloMin').prop('disabled', false);
      $('#player-eloMax').val(9999);
      $('#player-eloMax').prop('disabled', false);
      $('#player-tournamentsMin').val(0);
      $('#player-tournamentsMin').prop('disabled', false);
      $('#player-tournamentsMax').val(9999);
      $('#player-tournamentsMax').prop('disabled', false);
    }
    else {
      $('#advanced-search-options').slideUp();
      $('#player-eloMin').prop('disabled', true);
      $('#player-eloMax').prop('disabled', true);
      $('#player-tournamentsMin').prop('disabled', true);
      $('#player-tournamentsMax').prop('disabled', true);
    }
  });

  $('#player-search-form').submit(function(event) {
    event.preventDefault();

    let eloMin = $('#player-eloMin').val() || defaultMin;
    let eloMax = $('#player-eloMax').val() || defaultMax;
    let tournamentsMin = $('#player-tournamentsMin').val() || defaultMin;
    let tournamentsMax = $('#player-tournamentsMax').val() || defaultMax;

    if ($('#advanced-search-options').is(":hidden")) {
      eloMin = defaultMin;
      eloMax = defaultMax;
      tournamentsMin = defaultMin;
      tournamentsMax = defaultMax;
    }

    const data = {
        name: $('#player-name').val(),
        lowElo: eloMin,
        highElo: eloMax,
        lowNumMatches: tournamentsMin,
        highNumMatches: tournamentsMax
    };

    window.history.replaceState(null, '', "/account/search?name=" + encodeURIComponent(data.name));

    $.post('/account/get', data, function(response) {
      $('#player-view-row').empty();

      if (response === 'No Matching Players') {
        $('#player-search-alert').text("No Matching Players");
        $('#player-search-alert').slideDown();
      } else {
        $('#player-search-alert').hide();

        displayPlayer(0);
        function displayPlayer(index) {
          console.log(response.length);
          if (index >= response.length) { return };

          let player = response[index];
          let column = $('<div class="col-lg-4"></div>');
          let itemHTML = '<div class="card">' +
            '<a href="/player?id=' + player.playerID + '"> <h5 class="card-title">' + player.name + '</h5> </a>' +
            '<ul class="list-group">' +
              '<li class="list-group-item"> <b>Elo:</b> ' + player.elo + '</li>' +
              '<li class="list-group-item"> <b>Matches Played:</b> ' + player.numMatches + '</li>' +
            '</ul>' + 
          '</div><br>'
          column.append(itemHTML);
          column.hide();
          $('#player-view-row').append(column);
          if (index % 3 === 2) {
            column.slideDown(100, 'linear', function() {
              displayPlayer(index + 1);
            });
          } else {
            column.slideDown(100, 'linear');
            displayPlayer(index + 1);
          }
        }
        // for (let el in response) {
        //   let player = response[el];
        //   let column = $('<div class="col-lg-4"></div>');
        //   let itemHTML = '<div class="card">' +
        //     '<a href="/player?id=' + player.playerID + '"> <h5 class="card-title">' + player.name + '</h5> </a>' +
        //     '<ul class="list-group">' +
        //       '<li class="list-group-item"> <b>Elo:</b> ' + player.elo + '</li>' +
        //       '<li class="list-group-item"> <b>Tournaments Played:</b> ' + player.numMatches + '</li>' +
        //     '</ul>' + 
        //   '</div><br>'
        //   column.append(itemHTML);
        //   column.hide();
        //   $('#player-view-row').append(column);
        //   column.slideDown(200, swing, );
        // }
      }
    });
  });
});