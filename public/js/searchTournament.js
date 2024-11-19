$(function() {
  let defaultMin = 0;
  let defaultMax = Number.MAX_SAFE_INTEGER;

  $('#advanced-search-button').change(function() {
    if ($(this).is(":checked")) {
      $('#advanced-search-options').slideDown();
      $('#tournament-location').val(0);
      $('#tournament-location').prop('disabled', false);
      $('#tournament-buyInMin').val(0);
      $('#tournament-buyInMin').prop('disabled', false);
      $('#tournament-buyInMax').val(1000);
      $('#tournament-buyInMax').prop('disabled', false);
      $('#tournament-playersMin').val(0);
      $('#tournament-playersMin').prop('disabled', false);
      $('#tournament-playersMax').val(32);
      $('#tournament-playersMax').prop('disabled', false);
      $('#tournament-eloMin').val(0);
      $('#tournament-eloMin').prop('disabled', false);
      $('#tournament-eloMax').val(1000);
      $('#tournament-eloMax').prop('disabled', false);
    }
    else {
      $('#advanced-search-options').slideUp();
      $('#tournament-location').prop('disabled', true);
      $('#tournament-buyInMin').prop('disabled', true);
      $('#tournament-buyInMax').prop('disabled', true);
      $('#tournament-playersMin').prop('disabled', true);
      $('#tournament-playersMax').prop('disabled', true);
      $('#tournament-eloMin').prop('disabled', true);
      $('#tournament-eloMax').prop('disabled', true);
    }
  });

	$('#tournament-search-form').submit(function(event) {
		event.preventDefault();

		let location = $('#tournament-location').val() || "";
		let buyInMin = $('#tournament-buyInMin').val() || defaultMin;
		let buyInMax = $('#tournament-buyInMin').val() || defaultMax;
		let playersMin = $('#tournament-playersMin').val() || defaultMin;
		let playersMax = $('#tournament-playersMax').val() || defaultMax;
		let eloMin = $('#tournament-eloMin').val() || defaultMin;
		let eloMax = $('#tournament-eloMax').val() || defaultMax;

    if ($('#advanced-search-options').is(":hidden")) {
			location = "";
			buyInMin = defaultMin;
			buyInMax = defaultMax;
      playersMin = defaultMin;
      playersMax = defaultMax;
      eloMin = defaultMin;
      eloMax = defaultMax;
    }

		const data = {
			// this is where I would put data if it was a post request
		}

		$.get('/tournament/get-all', function(response) {
      $('#tournament-view-row').empty();

      if (response === 'No Matching Tournaments') {
        $('#tournament-search-alert').text("No Matching Tournaments");
        $('#tournament-search-alert').slideDown();
      } else {
        $('#tournament-search-alert').hide();

        for (let el in response) {
          let t = response[el];
          let column = $('<div class="col-lg-4"></div>');
          let itemHTML = '<div class="card">' +
            '<a href="/tournament/view?id=' + t.tournamentID + '"> <h5 class="card-title">' + t.name + '</h5> </a>' +
            '<ul class="list-group">' +
              '<li class="list-group-item">' + t.description  + '</li>' +
            '</ul>' + 
          '</div><br>' + 
          `<style>
          a {
            text-decoration-color: black;
          }
          b {
            font-weight: 500;
          }
          </style>`;
          column.append(itemHTML);
          $('#tournament-view-row').append(column);
        }
			}
		});
	});
});