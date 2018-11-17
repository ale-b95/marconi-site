$(function () {
    jQuery('#datetimepicker1').datetimepicker();
    
    jQuery.datetimepicker.setLocale('it');

    jQuery('#datetimepicker1').datetimepicker({
    minDate:'0',
    timepicker:false,
    format:'d.m.Y'
    });

    var sc_date;
    var classroom_name = "Seleziona aula";
    var classroom_id;
    var class_key;
    var class_name;
    
    /*
        the follower two varables are usefull to count the selected rows.
        the first represents the selected rows with no prenotation, the 
        second the selected rows with prenotation.
    */
    var cs_selected_rows = 0;
    var mb_selected_rows = 0;
    var selected_hours = [];
    var occupied_h = [];
    var occupied_cr = [];

    /*
        Load the information about the selected classroom on a selected day when
        the classroom and the day have been selected
    */
    $('#datetimepicker1, #select_classroom, #select_class').on('change', () => {
        sc_date = $("#datetimepicker1").datetimepicker('getValue');
        classroom_id = $("#select_classroom").val();
        classroom_name = $("#select_classroom").find(':selected').text();
        update_class_references();
        if (classroom_name != 'Seleziona aula') {
            selected_hours = [];
            cs_selected_rows = 0;
            mb_selected_rows = 0;
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
        
        /*
            If the class, the day, the classroom and the hour/s have been selected
            save the prenotation on the database.
        */
        if (class_name && class_name != 'Seleziona classe' && cs_selected_rows > 0 && sc_date >= today && classroom_name != "Seleziona aula") {
            
            for (var i = 0; i < selected_hours.length; i++) {
                var hour = selected_hours[i];
                firebase.database().ref('prenotation/'+sc_date.getFullYear()+'/'+(sc_date.getMonth() + 1)+'/'+sc_date.getDate()+'/'+classroom_id+'/'+hour+'/').set({
                class_key : class_key,
                class_name : class_name,
                classroom : classroom_name,
                teacher : user.displayName,
                teacher_key : user.uid
                });

                firebase.database().ref('class/'+class_key+'/prenotation/'+sc_date.getDate()+"-"+(sc_date.getMonth() + 1)+'-'+sc_date.getFullYear()+'/').update({
                    [hour] : classroom_name
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
            var class_hour = {};
            var promises = [];
            for (i in selected_hours) {
                var hour = selected_hours[i];
                var my_prom = firebase.database().ref('prenotation/'+sc_date.getFullYear()+'/'+(sc_date.getMonth() + 1)+'/'+sc_date.getDate()+'/'+classroom_id+'/'+selected_hours[i]).once('value', function(snap) {
                    if (class_hour.hasOwnProperty(snap.val().class_key+"")) {
                        var arr = class_hour[snap.val().class_key];
                        arr.push(this.h);
                        class_hour[snap.val().class_key] = arr;
                    } else {
                        var arr = [];
                        arr.push(this.h);
                        class_hour[snap.val().class_key] = arr;
                    }
                }.bind({h : hour}));
                promises.push(my_prom);
            }

            Promise.all(promises).then(() => {
                var classes = Object.keys(class_hour);
                for (x in classes) {
                    var arr = class_hour[classes[x]];
                    for (y in arr) {
                        firebase.database().ref('class/'+classes[x]+'/prenotation/'+sc_date.getDate()+'-'+(sc_date.getMonth() + 1)+'-'+sc_date.getFullYear()+'/'+arr[y]).remove();
                        firebase.database().ref('prenotation/'+sc_date.getFullYear()+'/'+(sc_date.getMonth() + 1)+'/'+sc_date.getDate()+'/'+classroom_id+'/'+arr[y]).remove();
                    }
                }
            });
            
            loadClassroomSchedule();
            selected_hours = [];
            cs_selected_rows = 0;
            mb_selected_rows = 0;
            $('#book_prenotation_btn').text('Prenota');
        } else if (sc_date < today) {
            alert('ERRORE: Non possono essere effettuate modifiche per la data selezionata.');
        }

        update_class_references();
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
        $("#schedule_table_body").empty();
        var clickable;
        var idx;
        var class_info = "";

        for (var hour = 8; hour<25; hour++) {
            clickable = true;
            idx = occupied_h.indexOf(hour+"");
            if (idx != -1) {
                if (occupied_cr[idx] != classroom_name) {
                    class_info = 'CLASSE NON DISPONIBILE!';
                    clickable = false;
                }
            } else {
                class_info = "";
            }

            $("#schedule_table_body").append(
            '<tr class="clickable-row" id="s_hid_'+hour+'" value="'+hour+'">'+
            '<th>'+SPECIAL_HOURS[hour]+'</th><td>'+ class_info +'</td>'+
            '</tr>');

            if (!clickable) {
                $("#s_hid_"+hour).removeClass('clickable-row');
                $("#s_hid_"+hour).addClass('booked');
            }
        }

        firebase.database().ref('prenotation/'+sc_date.getFullYear()+'/'+(sc_date.getMonth() + 1)+'/'+sc_date.getDate()+'/'+classroom_id+'/').once('value', snap => {
            snap.forEach(childSnap => {
                var hour = childSnap.key;
                var teacher_name = childSnap.val().teacher;
                var class_name = childSnap.val().class_name;
                var event_title = childSnap.val().event;
                var event_key = childSnap.val().event_key;
                var teacher_id = childSnap.val().teacher_key;
                var second_column;

                if (event_title) {
                    second_column = event_title;
                } else {
                    second_column = class_name + ' ' + teacher_name;
                }

                $("#s_hid_"+hour).empty();
                $("#s_hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');
                
                if (event_title) {
                    $("#s_hid_"+hour).addClass('event_prenotation');
                    $("#s_hid_"+hour).val(event_key);              
                } else {
                    var user = firebase.auth().currentUser;
                
                    if (user.uid == teacher_id){
                        $("#s_hid_"+hour).addClass('mybook');
                        $("#s_hid_"+hour).addClass('clickable-row');
                    } else {
                        $("#s_hid_"+hour).addClass('booked');
                        $("#s_hid_"+hour).removeClass('clickable-row');
                    }
                }
            });
        });
    }

    function increase_mb_select(x) {
        mb_selected_rows += x;

        if (mb_selected_rows > 0) {
            $('#book_prenotation_btn').text('Rimuovi');
        } else {
            $('#book_prenotation_btn').text('Prenota');
        }
    }

    function update_class_references() {
        class_name = $("#select_class").find(':selected').text();
        class_key = $("#select_class").find(':selected').val();

        occupied_h = [];
        occupied_cr = [];

        firebase.database().ref('class/'
        + class_key
        + '/prenotation/'
        + sc_date.getDate()+"-"
        + (sc_date.getMonth() + 1)+'-'
        + sc_date.getFullYear()+'/').once('value', snap => {
            snap.forEach(childSnap => {
                occupied_h.push(childSnap.key);
                occupied_cr.push(childSnap.val());
            });
        }).then(() => {
            loadClassroomSchedule();
        });
    }
});