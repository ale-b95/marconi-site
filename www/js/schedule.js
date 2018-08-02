$(function () {
    
    var sc_date;
    var classroom_name;
    var classroom_id;
    
    /*
        the follower tho varables are usefull to count the selected rows.
        the first represents the selected rows with no prenotation, the 
        second the selected rows with prenotation.
    */
    var cs_selected_rows = 0;
    var mb_selected_rows = 0;
    var selected_hours = [];

    $('#classroom_datepicker').datepicker({
        format: 'dd/mm/yyyy',
        language: "it",
        autoclose: true,
        todayHighlight: true,
        toggleActive: true,
        daysOfWeekHighlighted: "0"
    });

    /*
        Load the information about the selected classroom on a selected day when
        the classroom and the day have been selected
    */
    $('#classroom_datepicker').on('changeDate', () => {
        if (classroom_name != "Seleziona aula") {
            loadClassroomSchedule();
        }
    });

    $("#select_classroom").on('change', () => {
        if (sc_date) {
            loadClassroomSchedule();
        }
    });

    /*
        Attach a listener to each row based on the kind of prenotation is set for 
        the relative hour
    */
    $('#schedule_table').on('click', '.clickable-row', function(event) {
        var idx;

        if ($(this).hasClass('selected_row')) {
            /*
                If the hour is already selected one more touch will deselect it
            */
            $(this).removeClass('selected_row');
            idx = selected_hours.indexOf($(this).attr('value'));
            if (idx >= 0) selected_hours.splice(idx, 1);
            cs_selected_rows--;
        } else if (!$(this).hasClass('selected_row') && !$(this).hasClass('mybook') && mb_selected_rows == 0 && !$(this).hasClass('event_prenotation')) {
            /*
                If the row is not already selected, it does not represents an event
                and does not represent a prenotation, one touch will make it selected
            */
            $(this).addClass('selected_row');
            selected_hours.push($(this).attr('value'));
            cs_selected_rows++;
        } else if ($(this).hasClass('mybook') && cs_selected_rows == 0) {
            /*
                If the row contains a prenotation wich has been made by the
                current user and no rows with no prenotation are selected, one touch
                will make the row selected*
            */
            $(this).addClass('mybook_selected');
            $(this).removeClass('mybook');
            selected_hours.push($(this).attr('value'));
            increase_mb_select(+1);
        } else if ($(this).hasClass('mybook_selected')) {
            /*
                If the row contains a prenotation which has been made by the
                current user and is selected one more touch will make the row 
                deselected.
            */
            $(this).removeClass('mybook_selected');
            $(this).addClass('mybook');
            idx = selected_hours.indexOf($(this).attr('value'));

            if (idx >= 0) selected_hours.splice(idx, 1);
                increase_mb_select(-1);
        }
    });

    /*
        Create a prenotation for each selected row
    */
    $('#book_prenotation_btn').on('click', () => {
        
        /*
            Check whether the day of the selected has already passed, in wich
            case no prenotations are allowed.
        */
        var today = Date.now() - (24*3600*1000);
        var user = firebase.auth().currentUser;        
        var class_name = $("#select_class").find(':selected').text();
        
        /*
            If the class, the day, the classroom and the hour/s have been selected
            save the prenotation on the database.
        */
        if (class_name && class_name != 'Seleziona classe' && cs_selected_rows > 0 && sc_date >= today && classroom_name != "Seleziona aula") {
            
            for (var i = 0; i < selected_hours.length; i++) {            
                firebase.database().ref('institute/'+INSTITUTE_ID+'/prenotation/'+sc_date.getFullYear()+'/'+(sc_date.getMonth() + 1)+'/'+sc_date.getDate()+'/'+classroom_id+'/'+selected_hours[i]+'/').set({
                class : class_name,
                classroom : classroom_name,
                teacher : user.displayName,
                teacher_key : user.uid
                });
            }
            selected_hours = [];
            loadClassroomSchedule();
            cs_selected_rows = 0;
            mb_selected_rows = 0;
            $('#book_prenotation_btn').text('Prenota');
        } else if (class_name == 'Seleziona classe' && cs_selected_rows > 0){
            alert ('Seleziona una classe');
        } else if (classroom_name == 'Seleziona aula') {
            alert ("Seleziona un'aula");
        } else if (mb_selected_rows > 0) {
            /*
                If the selected rows already have a prenotation the button will remove
                the previous prenotation.
            */
            for (var i = 0; i < selected_hours.length; i++) {
                var prenotation_ref = firebase.database().ref('institute/'+INSTITUTE_ID+'/prenotation/'+sc_date.getFullYear()+'/'+(sc_date.getMonth() + 1)+'/'+sc_date.getDate()+'/'+classroom_id+'/'+selected_hours[i]);
                prenotation_ref.remove();
            }
            loadClassroomSchedule();
            selected_hours = [];
            cs_selected_rows = 0;
            mb_selected_rows = 0;
            $('#book_prenotation_btn').text('Prenota');
        } else if (sc_date < today) {
            alert('ERRORE: Non possono essere effettuate modifiche per la data selezionata.');
        }
    });

    $('.cs_back_btn').on('click', () => {
        cs_selected_rows = 0;
        mb_selected_rows = 0;
        $('#book_prenotation_btn').text('Prenota');
        selected_hours = [];
        $("#schedule_table_body").empty();
    });
    
    /*
       Insert the rows with the prenotation for the selected day and the selected classroom
    */
    function loadClassroomSchedule() {
        sc_date = $("#classroom_datepicker").datepicker('getDate');
        
        classroom_id = $("#select_classroom").val();
        classroom_name = $("#select_classroom").find(':selected').text();
        
        if (classroom_id != 'Seleziona aula' && sc_date) {
            $("#schedule_table_body").empty();
            
            for (var hour = 8; hour<16; hour++) {
                $("#schedule_table_body").append(
                '<tr class="clickable-row" id="hid_'+hour+'" value="'+hour+'">'+
                '<th>'+hour+':00</th><td></td>'+
                '</tr>');
            }
            
            var pRef = firebase.database().ref('institute/'+INSTITUTE_ID+'/prenotation/'+sc_date.getFullYear()+'/'+(sc_date.getMonth() + 1)+'/'+sc_date.getDate()+'/'+classroom_id+'/');
            pRef.once('value', snap => {
                
                snap.forEach(childSnap => {
                    var hour = childSnap.key;
                    var hour;
                    var teacher_name;
                    var class_name;
                    var event_title;
                    var event_key;
                    var second_column;
                    var teacher_id;
                    childSnap.forEach(gcSnap => {
                        
                        if (gcSnap.key == 'teacher') {
                            teacher_name = gcSnap.val();
                        } else if (gcSnap.key == 'event') {
                            event_title = gcSnap.val();
                        } else if (gcSnap.key == 'class') {
                            class_name =  gcSnap.val();
                        } else if (gcSnap.key == 'event_key') {
                            event_key = gcSnap.val();
                        } else if (gcSnap.key == 'teacher_key') {
                            teacher_id = gcSnap.val();
                        }
                    }); 

                    if (event_title) {
                        second_column = event_title;
                    } else {
                        second_column = class_name + ' ' + teacher_name;
                    }

                    $("#hid_"+hour).empty();
                    $("#hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');
                    
                    if (event_title) {
                        $("#hid_"+hour).addClass('event_prenotation');
                        $("#hid_"+hour).val(event_key);              
                    } else {
                        var user = firebase.auth().currentUser;
                    
                        if (user.uid == teacher_id){
                            $("#hid_"+hour).addClass('mybook');
                        } else {
                            $("#hid_"+hour).addClass('booked');
                            $("#hid_"+hour).removeClass('clickable-row');
                        }
                    }
                });
            });
        }
    }

    function increase_mb_select(x) {
        mb_selected_rows += x;

        if (mb_selected_rows > 0) {
            $('#book_prenotation_btn').text('Rimuovi');
        } else {
            $('#book_prenotation_btn').text('Prenota');
        }
    }
});
