$(function() {
  // Initialize Firebase

  // Test config
  /*
  var config = {
    apiKey: "AIzaSyBcWoPOfCRHwFpOE2gFncQD6HtIiD1ftro",
    authDomain: "marconi-2c01d.firebaseapp.com",
    databaseURL: "https://marconi-2c01d.firebaseio.com",
    projectId: "marconi-2c01d",
    storageBucket: "",
    messagingSenderId: "916037440328"
  };
  */

  // Release config
  var config = {
    apiKey: "AIzaSyBLRwoHQgSKYJYuxm9N2CCKdqv59aNbSJk ",
    authDomain: "marconi-release.firebaseapp.com",
    databaseURL: "https://marconi-release.firebaseio.com/",
    projectId: "marconi-release",
    storageBucket: "",
    messagingSenderId: "916037440328"
  };
  
  firebase.initializeApp(config);
});
