$(async function() {
  let URLparams = new URLSearchParams(document.location.search);
  let URLid = URLparams.get("id");

  const fetchSessionData = async () => {
    return await $.get('/api/session');
  };

  const session = await fetchSessionData(); // waits for this async function to finish before continuing
  let playerID = session.playerID; //localStorage.getItem("playerID");

  const data = {
    playerID: playerID
  };

  let owner = (playerID.toString() === URLid) ? true : false;

  $.post('/account/get/isPaid', data, function(response) {
    if (response === 'Not Paid' && owner) {
      $('#membership-advert-alert').slideDown();
    }
  });

  $("#change-name-button").click(function() {
    let newName = prompt("Please Enter A New Name:");
    if (newName !== null && newName !== "") {
      const nameData = {
        playerID: playerID, // session playerID, so you cannot change other people's name
        name: newName
      }
  
      $.post('/account/updatename', nameData, function(response) {
        if (response === 'Success') {
          alert("Your name was successfully changed!");
          location.reload();
        }
        else {
          alert("An error has occured, please try again later or contact an admin for help.");
          location.reload();
        }
      });
    }
  });

  $("#delete-account-button").click(function() {
    let confirmation = prompt('Please type "yes" to confirm:');
    if (confirmation.toLowerCase() === "yes") {
      const deleteData = {
        playerID: playerID, // session playerID, so you cannot delete other people's account
      }
  
      //TODO: make the delete post request work
      $.post('/account/delete', deleteData, function(response) {
        if (response === 'Success') {
          alert("Your account was successfully deleted. We are sorry to see you go");
          location.reload();
        }
        else {
          alert("An error has occured, please try again later or contact an admin for help.");
          location.reload();
        }
      });
    }
  });
});