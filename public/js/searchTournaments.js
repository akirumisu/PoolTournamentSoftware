$(function() {
	// Sends an API call defined in server.js, get('/tournament/get-all')
	// returns a json with all tournaments
	$.get('/tournament/get-all', function(response) {
		for (let el in response) {
			let t = response[el];
			// Using bootstrap columns, we include a length of 4. 12/4, This means every 3 tournaments is a new row.
			let column = $('<div class="col-lg-4"></div>');
			// HTML allows us to add formatting. You can edit the 'tournament' class in css or add more classes
			let itemHTML = '<div class="tournament">' +
					'<a href="/tournament/view?id=' + t.tournamentID + '"> <h4>' + t.name + '</h4> </a>' +
					'<p>' + t.description + '</p>' +
					'<br>' +
					'</div>';
			column.append(itemHTML);
			// By appending each tournament, this row will have several columns. Although it is 1 row element,
			// there will visually be multiple rows because only 3 columns can exist on each row
			$('#tournament-view-row').append(column);
		}
		// Not necessary, but for testing
		console.log(response);
	});
});