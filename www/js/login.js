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
  });

  $("#new_institute_button").on('click', () => {
    showPage($("#new_institute"));
  });

  $("#create_institute_button").on('click', () => {
    createInstitute();
  });

  $("#log_institute_button").on('click', () => {
    logOnInstitute();
  });

/*
  Called at every user state change (login / logout)
*/
  firebase.auth().onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
      console.log(firebaseUser);
      console.log('logged in');
      quickLog();
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
            email: USER.email
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
    INSTITUTE_ID = null;
    showPage($("#login"));
  }

  /*
    after user login
    automatically log in the default institute (last logged one)
    if presen
  */
  function quickLog() {
    const USER = firebase.auth().currentUser;
    /*
      get database and authentication reference to obtain user id and access to
      the "default institute" field of the user
    */
    const ref =  firebase.database().ref('user/' + USER.uid+'/confirmed');

    /*
      check if the "default institute" field is set
      if it's set check if user is authorized,
      if it is automatically log on the institute page
    */
    ref.once('value', snap => {
      if (snap.val() == "true") {
        alert("ok");
        goInstitutePage();
      } else  {
        goUserPage();
      }
    });
  }

  /*
    get the institutes name list allow the user to pick the one he wants to log
    on
  */
  function getInstituteList() {
    $("#my_institutes").empty();
    $("#all_institutes").empty();

    /*
      get database and user reference
    */
    const USER = firebase.auth().currentUser;
    const dbRef = firebase.database().ref();

    /*
      retrive the list of the institutes known to the user
    */
    var user_inst = dbRef.child('user/'+ USER.uid + '/institute/').orderByKey();
    user_inst.once('value', snap => {
      snap.forEach(childSnap => {
        var name = childSnap.val();
        var key = childSnap.key;
        if (key != 'default_institute') {
          /*
            show each one as a option in the html input field
          */
          $("#my_institutes").append('<option value="'+ key +'">'+ name +'</option>');
        }
      });
    });

    /*
      retrive the list of all institutes in the database
    */
    var global_inst = dbRef.child('institute/').orderByKey();
    global_inst.once('value', snap => {
      snap.forEach(childSnap => {
        var name = childSnap.child('name').val();
        var key = childSnap.key;
        /*
          show each one as a option in the html input field
        */
        $("#all_institutes").append('<option value="'+ key +'">'+ name +'</option>');
      });
    });
  }

/*
  access to the selected institute

  it is required for the user to be confirmed by the institute admin
  access is denied otherwise
*/
  function logOnInstitute() {
   
    const USER = firebase.auth().currentUser;
    /*
      get database and authentication reference to obtain user id and access to
      the "default institute" field of the user
    */
    const ref =  firebase.database().ref('user/' + USER.uid);
    /*
      check if the user is authorized to access to the institute page
      if the user has already been confirmed, allow access otherwise notify the
      "waiting confirmation" status and go to the user page
    */
    ref.once('value', snap => {
      if (snap.val().access == true) {
        goInstitutePage();
      } else  {
        alert("Non hai i permessi necessari per accedere a questo istituto. Contatta gli amministratori per richiedere l'accesso.");
        goUserPage();
      }
    });
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
    firebase.database().ref('user/' + USER.uid).once('value', snap => {

      if (snap.val().admin == true) {
          showPage($("#institute_page"));
          $("#admin_btn").show();
      } else {
        $("#admin_btn").hide();
        showPage($("#institute_page"));
      }
    });
  }
});
