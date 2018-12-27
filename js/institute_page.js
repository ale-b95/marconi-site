var DataFormFillUtility = {
    /*
        fill the specified select list with the classrooms loaded from the database
        is possible to personalize the first option field adding a default message
    */
    loadClassroomSelectList : function (form, defaultmsg, extraOption) {
        $('#'+form).empty();
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        if (defaultmsg == null) {
            defaultmsg = "Seleziona un'aula";
        }
            
        $('#'+form).append('<option value="" disabled selected>'+ defaultmsg +'</option>');
        

        if (extraOption != null) {
            $('#'+form).append('<option>'+extraOption+'</option>');
        }
        
        /*
            get the reference to the database to obtain the list of the classrooms
        */
        firebase.database().ref('classroom/').orderByChild('name').once('value', snap => {
            /*
                generate the html code for each classroom found on the database
            */
            snap.forEach(childSnap => {
                var name = childSnap.child('/name').val();
                var key = childSnap.key;
                $('#'+form).append('<option value="'+key+'">'+name+ '</option>');
            });
        });
    },

    /*
        fill the specified select list with the classes loaded from the database
        is possible to personalize the first option field adding a default message
    */
    loadClassSelectList : function (form, defaultmsg) {
        $('#'+form).empty();
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        if (defaultmsg == null) {
            defaultmsg = "Seleziona classe";
        }
        $('#'+form).append('<option value="" disabled selected>'+ defaultmsg +'</option>');

        /*
            get the reference to the database to obtain the list of classes
            and generate the html code for each class found on the database
        */
        firebase.database().ref('class/').orderByChild('name').once('value', snap => {
            snap.forEach(childSnap => {
                $('#'+form).append('<option value="'+childSnap.key+'">'+childSnap.val().name+'</option>');
            });
        });
    },

    loadUserSelectList : function (select_user, defaultmsg) {
        $('#'+select_user).empty();

        if (defaultmsg == null) {
            defaultmsg = "Seleziona un utente";
        }
        $('#'+select_user).append('<option value="" disabled selected>'+ defaultmsg +'</option>');

        /*
            get the reference to the database to obtain the list of classes
            and generate the html code for each class found on the database
        */
        firebase.database().ref('user/').once('value', snap => {
            snap.forEach(childSnap => {
                $('#'+select_user).append('<option value="'+childSnap.key+'">'+childSnap.val().name + ' ' + childSnap.val().surname+'</option>');
            });
        });
    },

    createDayScheduleTable : function (table_body) {
        for (var day = 0; day < 7; day++) {
            for (var hour = 8; hour<25; hour++) {
                $("#"+table_body).append(
                '<tr class="clickable-row d-'+day+' d-row" id="'+table_body+'_'+hour+'_'+day+' collapse" value="'+hour+'">'+
                '<th>'+SPECIAL_HOURS[hour]+'</th><td></td></tr>');
            }
        }
    },

    loadDayScheduleTable : function (table_body, table_click_ref, day) {
        $('.d-row').hide();
        $('.d-'+day).show();
        
        for (var hour = 8; hour<25; hour++) {
            if (table_click_ref.selected_hours[day].includes(hour)) {
                $('#'+table_body+'_'+hour+'_'+day).addClass('selected_row');
            }
        }
    }
}

$(function () {
    /*
        Handle the buttons on institute page and show the correct page with the 
        relative data loaded.
    */
    $("#croom_prenotation_btn").on('click', () => {
        $("#schedule_table_body").empty();
        DataFormFillUtility.loadClassroomSelectList("select_classroom");
        DataFormFillUtility.loadClassSelectList("select_class");
        showPage($("#schedule_page"));
    });

    /*$(".back_btn").on('click', () => {
        console.log('TODO: set reset function in institute page');
        $("#class_pren_table").slideUp();
        $('#prenotations_list').empty();
        $('#datetimepicker2').datetimepicker('reset');
    });*/

    $("#select_class_pren, datetimepicker2").on('change', () => {
        $("#class_pren_table").slideDown();
    })
    
    $("#events_btn").on('click', () => {
        DataFormFillUtility.loadClassroomSelectList("select_event_classroom", null, "Inserisci nuovo luogo");
        DataFormFillUtility.loadClassSelectList("event_class");
        EventsManagement.init();
        EventsManagement.loadEventList();
        showPage($("#events_page"));
        $("#schedule_event_table_body").empty();
        $("#event_place").hide();
    });
    
    $("#search_class_btn").on('click', () => {
        /*DataFormFillUtility.loadClassSelectList("select_class_pren");
        showPage($("#prenotations_page"));*/
    });

    $("#bacheca_btn").on('click', () => {
        /*Showcase.loadShowcase();
        Showcase.loadEventShowcase();
        showPage($("#big_table_page"));*/
    });

    $(".back_btn").on('click', () => {
        backPage();
    });
});