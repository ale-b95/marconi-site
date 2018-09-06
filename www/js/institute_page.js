$(function () {
    /*
        Handle the buttons on institute page and show the correct page with the 
        relative data loaded.
    */
    
    $("#schedule_btn").on('click', () => {
        $("#schedule_table_body").empty();
        loadClassroomSelectList("select_classroom");
        loadClassSelectList("select_class");
        showPage($("#schedule_page"));
    });
    
    $("#events_btn").on('click', () => {
        $("#schedule_event_table_body").empty();
        loadClassroomSelectList("select_event_classroom", "Esterno");
        loadClassSelectList("event_class");
        showPage($("#events_page"));
    });
    
    $("#prenotations_btn").on('click', () => {
        loadClassSelectList("select_prenotations");
        showPage($("#prenotations_page"));
    });
    
    /*
        fill the specified select list with the classrooms loaded from the database
        is possible to personalize the first option field adding a default message
    */
    function loadClassroomSelectList(select_classroom, defaultmsg) {
         $('#'+select_classroom).empty();
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        $('#'+select_classroom).append('<option>Seleziona aula</option>');
        if (defaultmsg != null) {
             $('#'+select_classroom).append('<option value="'+defaultmsg+'">'+ defaultmsg +'</option>');
        }
       
        
        /*
            get the reference to the database to obtain the list of the classrooms
        */
        const dbRef = firebase.database().ref('classroom/');
        
        var classroomList = dbRef.once('value', snap => {
            /*
                generate the html code for each classroom found on the database
            */
            snap.forEach(childSnap => {
                var name = childSnap.child('/classroom_name').val();
                var key = childSnap.key;
                $('#'+select_classroom).append('<option value="'+key+'">'+name+ '</option>');
            });
        });
    }

    /*
        fill the specified select list with the classes loaded from the database
        is possible to personalize the first option field adding a default message
    */
    function loadClassSelectList(select_class, defaultmsg) {
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        if (defaultmsg == null) {
            defaultmsg = "Seleziona classe";
        }
        
        $('#'+select_class).empty();
        $('#'+select_class).append('<option>'+ defaultmsg +'</option>');
        
        /*
            get the reference to the database to obtain the list of classes
            and generate the html code for each class found on the database
        */
        firebase.database().ref('class/').once('value', snap => {
             snap.forEach(childSnap => {
                $('#'+select_class).append('<option>'+childSnap.key+'</option>');
            });
        });
    }   
    
    
});