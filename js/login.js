$(function () {
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
    history.go(0);
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
    const txtCode = $("#sUpCode").val();
    var available = true;

    if (SecurityCodeUtility.readCode(txtCode)) {
      
      if (txtPswd.value == txtPswdRep.value) {
        
        var dispName = txtName.value + " " + txtSurname.value;
         
        var dbRef = firebase.database().ref();
        dbRef.child('user/').once('value', snap => {
          snap.forEach(chidsnap => {
            if (chidsnap.val().code == txtCode) {
              available = false;
              alert ("Codice di sicurezza già utilizzato");
            }
          });
        }).then(() =>{
          if (available) {
            firebase.auth().createUserWithEmailAndPassword(txtEmailSignup.value, txtPswd.value).then(() => {
              firebase.auth().currentUser.updateProfile({
                displayName: dispName
              }).catch(updateUser => console.log('user not updated ' + updateUser.message))}).then(() => {
                  const USER = firebase.auth().currentUser;
                  dbRef.child('user/' + USER.uid).set({
                    name: txtName.value,
                    surname: txtSurname.value,
                    email: USER.email,
                    priviledges: "0",
                    code : txtCode
                  }).catch(ops => console.log('ERROR '+ops.message));
                goUserPage();
              }).catch(createUser => console.log('error during user creation ' + createUser.message));
          }
        });
      } else {
        $(this).closest('form').find("input[type=password]").val("");
      }
    } else {
      alert ("Codice di sicurezza non valido");
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
    if (USER) {
      $("#user_info").empty();
      $("#user_info").append("<p>User: "+ USER.displayName + '<br/>Email: ' + USER.email + '</p>');
      showPage($("#user_page"));
    } else {
      showPage($("#login"));
    }
  }

/*
  show institute info on institute page
*/
  function goInstitutePage () {
    firebase.database().ref('last_update').once('value', snap => {
      if (snap.val() == 'x') {
        firebase.database().ref().update({
          last_update : new Date().getTime()
        });
      } else {
        var now = new Date().getTime();
        var lastUpdate = snap.val();
        if (lastUpdate < (now - 1000*60*60*24)) {
          firebase.database().ref().update({
            last_update : now
          });
          cleanDB.removeOldPrenotations();          
        }
      }
    }); 
    /*
      load institute info
    */

    $("#institute_info").text("L.S. Marconi Pesaro");
    const USER = firebase.auth().currentUser;
    if (USER) {
      firebase.database().ref('user/' + USER.uid).once('value', snap => {
        if (snap.val().priviledges == "1") {
          showPage($("#institute_page"));
          $("#admin_btn").show();
          $("#croom_prenotation_btn").show();
          $("#events_btn").show();
          $("#search_class_btn").show();          
        } else if (snap.val().priviledges == "0") {
          $("#admin_btn").hide();
          $("#croom_prenotation_btn").show();
          $("#events_btn").show();
          $("#search_class_btn").show();
          showPage($("#institute_page"));
        }  else if (snap.val().priviledges == "-1") {
          logAsGuest();
        }
      });
    } else {
      logAsGuest()
    }
  }

  function logAsGuest() {
    $("#admin_btn").hide();
    $("#croom_prenotation_btn").hide();
    $("#search_class_btn").show();
    $("#events_btn").hide();
    showPage($("#institute_page"));
  }
});
