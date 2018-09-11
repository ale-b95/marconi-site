$(function () {

  /*HOST - 1, USER - 2, ADMIN - 3 */

  $(".collapse").hide();

  $("#signup_link").on('click',() => {
    showPage($("#signup"));
  });

  $(".login_page_btn").on('click',() => {
    showPage($("#login"));
  });

  $(".user_page_btn").on('click', () => {
    goUserPage();
  });

  $(".institute_page_btn").on('click', () => {
    goInstitutePage();
  });

  $("#login_button").on('click', () => {
    userLogin();
  });

  $("#signup_button").on('click', () => {
    registerNewUser();
  });

  $("#logout_button").on('click', () => {
    logOut();
  });

  $("#log_institute_button").on('click', () => {
    goInstitutePage();
  });

  $("#guest_button").on('click', () => {
    logAsGuest();
  });

/*
  Called at every user state change (login / logout)
*/
  firebase.auth().onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
      console.log(firebaseUser);
      console.log('logged in');
      goInstitutePage();
    } else {
      console.log('not logged in');
      showPage($("#login"));
    }
  });

/*
    Creates a new user and updates its displayName
*/
  function registerNewUser() {
    const txtName = $("#sUpName")[0];
    const txtSurname = $("#sUpSurname")[0];
    const txtEmailSignup = $("#sUpEmail")[0];
    const txtPswd = $("#sUpPwd")[0];
    const txtPswdRep = $("#sUpPwdRep")[0];

    if (txtPswd.value == txtPswdRep.value) {
      /*
        Get email and password
      */
      var dispName = txtName.value + " " + txtSurname.value;
      
      /*
            Signup
      */    
      firebase.auth().createUserWithEmailAndPassword(txtEmailSignup.value, txtPswd.value)
      .then(() => {
        /*
            Set a display name for the user
        */
        firebase.auth().currentUser.updateProfile({
          displayName: dispName
        })
        .catch(updateUser => console.log('user not updated ' + updateUser.message))
      }).then(() => {
          const USER = firebase.auth().currentUser;
          var dbRef = firebase.database().ref();

          dbRef.child('user/' + USER.uid).set({
            name: txtName.value,
            surname: txtSurname.value,
            email: USER.email,
            priviledges: "1"
          }).catch(ops => console.log('ERROR '+ops.message));
        goUserPage();
      }).catch(createUser => console.log('error during user creation ' + createUser.message));
    } else {
      $(this).closest('form').find("input[type=password]").val("");
    }
  }

    /*
      login with the user email and password, log into the default institute if
      it has already been set
    */
  function userLogin() {
    const txtEmailLogin = $("#lInEmail")[0];
    const txtPwdLogin = $("#lInPwd")[0];

    const email = txtEmailLogin.value;
    const pwd = txtPwdLogin.value;

    firebase.auth().signInWithEmailAndPassword(email, pwd)
    .catch(e => console.log('login error: ' + e.message));
  }

  function logOut() {
    firebase.auth().signOut();
    showPage($("#login"));
  }

/*
  show user data (name and password) on the user page
*/
  function goUserPage() {
    const USER = firebase.auth().currentUser;
    $("#user_info").empty();
    $("#user_info").append("<p>User: "+ USER.displayName + '<br/>Email: ' + USER.email + '</p>');
    showPage($("#user_page"));
  }

/*
  show institute info on institute page
*/
  function goInstitutePage () {
    /*
      load institute info
    */

    $("#institute_info").text("L.S. Marconi Pesaro");
    const USER = firebase.auth().currentUser;
    if (USER) {
      firebase.database().ref('user/' + USER.uid).once('value', snap => {
        if (snap.val().priviledges == "3") {
          showPage($("#institute_page"));
          $("#admin_btn").show();
          $("#schedule_btn").show();
          $("#events_btn").show();
          $("#prenotations_btn").show();
        } else if (snap.val().priviledges == "2") {
          $("#admin_btn").hide();
          $("#schedule_btn").show();
          $("#events_btn").show();
          $("#prenotations_btn").show();
          showPage($("#institute_page"));
        } else if (snap.val().priviledges == "1") {
          $("#admin_btn").hide();
          $("#schedule_btn").hide();
          $("#events_btn").hide();
          $("#prenotations_btn").hide();
          showPage($("#institute_page"));
        }
      });
    } else {
      logAsGuest()
    }
  }

  function logAsGuest() {
    $("#admin_btn").hide();
    $("#schedule_btn").hide();
    $("#events_btn").hide();
    $("#prenotations_btn").hide();
    showPage($("#institute_page"));
  }
});
