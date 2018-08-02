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
    getInstituteList();
    showPage($("#log_institute"));
  });

  $("#choose_inst").on('click', () => {
    logOnInstitute();
  });

/*
  Called at every user state change (login / logout)
*/
  firebase.auth().onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
      console.log(firebaseUser);
      console.log('logged in');
      logDefaultInstitute();
    } else {
      console.log('not logged in');
      showPage($("#login"));
    }
  });

/*
    Creates a new user and updates its displayName
*/
  function registerNewUser() {
    const formSignup = $('#signup_form')[0];
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

          dbRef.child('user/' + USER.uid + '/user_data').set({
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
  function logDefaultInstitute() {
    const USER = firebase.auth().currentUser;
    /*
      get database and authentication reference to obtain user id and access to
      the "default institute" field of the user
    */
    const dbRef = firebase.database().ref();
    const ref = dbRef.child('user/' + USER.uid + '/institute/default_institute');

    /*
      check if the "default institute" field is set
      if it's set check if user is authorized,
      if it is automatically log on the institute page
    */
    ref.once('value', snap => {
      if (snap.val() != null) {
        INSTITUTE_ID = snap.val();
        dbRef.child('institute/' + INSTITUTE_ID + '/user/' + USER.uid).once('value',snap => {
          snap.forEach(childSnap => {
            if (childSnap.key == 'confirmed' && childSnap.val() == true) {
                goInstitutePage();
            } else  {
                goUserPage();
            }
          });
        });
      } else {
        goUserPage();
      }
    });
  }

  /*
    create a new institute in the db and set the user as admin
  */
  function createInstitute() {
    /*
      get institte name from the html text input field
      retrive database and user reference
    */
    const institute_name = $("#nInstInstName")[0].value;
    const USER = firebase.auth().currentUser;
    const ref = firebase.database().ref();
    /*
      check if the institute name is valid
    */
    if (institute_name.length >= 1 ) {
      /*
        if it is insert the institute in the db
        (an unique key is automatically generated)
      */
      var inst_ref = ref.child('institute').push({
        name: institute_name
      });

      /*
        get the reference (unique key) to the new institute
      */
      var inst_id = inst_ref.key;

      /*
        add the user to the institute's user list, grant him access and
        admin privileges
      */
      ref.child('institute/' + inst_id + '/user/'+ USER.uid).set({
        name: USER.displayName,
        admin: true,
        confirmed: true
      });

      /*
        add the institute to the user's institute list
      */
      ref.child('user/'+ USER.uid +'/institute').update({
        [inst_id] : institute_name
      });

      /*
        set the institute as default institute for the user
      */
      ref.child('user/'+ USER.uid + '/institute/').update({
        default_institute : inst_ref.key
      });

      /*
        set institute global variables
      */
      INSTITUTE_ID = inst_ref.key;

      /*
        send the user to the institute page
      */
      goInstitutePage();
    } else {
      alert('Insert institute name');
    }
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
    /*
      get the selected value from the selection field in the html page
    */
    const USER = firebase.auth().currentUser;
    var inst_id = $("#select_institute").val();
    var inst_name = $("#select_institute").find(':selected').text();
    /*
      ensure the value is valid
    */
    if (inst_name != 'Seleziona istituto') {
      /*
        if it is get database and user reference
      */
      const dbRef = firebase.database().ref();

      /*
        insert the institute to the user institute list
      */
      dbRef.child('user/' + USER.uid + '/institute/').update({
        [inst_id] : inst_name
      });

      /*
        insert the user to the institute user list
      */
      dbRef.child('institute/' + inst_id + '/user/' + USER.uid).update({
        name: USER.displayName
      });

      /*
        check if the user is authorized to access to the institute page
      */
      dbRef.child('institute/' + inst_id + '/user/' + USER.uid).once('value',snap => {
        var conf = false;
        snap.forEach(childSnap => {
          if (childSnap.key == 'confirmed' && childSnap.val() == true) {
            conf = true;
          }
        });

        /*
          if the user is confirmed, allow access otherwise notify the
          "waiting confirmation" status and go to the user page
        */
        if (conf) {

          /*
            set the institute as the default user institute
          */
          dbRef.child('user/' + USER.uid + '/institute').update({
            default_institute : inst_id
          });

          INSTITUTE_ID = inst_id;
          goInstitutePage();
        } else {
          goUserPage();
          alert("Non hai i permessi necessari per accedere a questo istituto. Contatta gli amministratori per richiedere l'accesso.");
        }
      });
    } else {
      alert('Seleziona un istituto');
    }
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
    if (INSTITUTE_ID != null) {
      const USER = firebase.auth().currentUser;
      var ref = firebase.database().ref('institute/' + INSTITUTE_ID);

      ref.once('value', snap => {
        snap.forEach(childSnap => {
          if (childSnap.key == 'name') {
            $("#institute_info").text(childSnap.val());
          }
        });
      });

      ref.child('/user/' + USER.uid).once('value',snap => {
        var admin = false;
        snap.forEach(childSnap => {
          if (childSnap.key == 'admin' && childSnap.val() == true) {
            admin = true;
          }
        });

        if (admin) {
            showPage($("#institute_page"));
            $("#admin_btn").show();
        } else {
          $("#admin_btn").hide();
          showPage($("#institute_page"));
        }
      });
    }
  }
});
