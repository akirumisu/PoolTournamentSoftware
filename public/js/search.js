$(function() {
  $('#nav-tournament-search-form').submit(function(event) {
    event.preventDefault();

    let name = $('#nav-tournament-search-name').val();
    window.location.replace("/tournament/search?name=" + name);
  });

  $('#nav-account-search-form').submit(function(event) {
    event.preventDefault();

    let name = $('#nav-account-search-name').val();
    window.location.replace("/account/search?name=" + name);
  });
});