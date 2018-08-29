$(function () {
    jQuery('#datetimepicker2').datetimepicker();

/************************ show events ************************/
    var year;
    var month;
    var startdate;
    var enddate;
    
    jQuery('#datetimepicker2').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'M.Y'
    });
    
    $('#update-event-btn').on('click', (e) => {
        var e_date = $("#datetimepicker2").datetimepicker('getValue');
        year = String(e_date).split(" ")[3];
        month = new Date(e_date).getMonth() + 1;
        startdate = new Date(year+ '-' + month);
        enddate = new Date(startdate);
        enddate.setMonth(enddate.getMonth() + 1);
        loadEventList();
    });
    
    $("#abort_delete").on('click', () => {
        $("#delete_event").addClass('btn-primary');
        $("#delete_event").removeClass('btn-danger');
        $("#delete_event").text('Elimina evento');
        $("#abort_delete").slideUp();
    });   
    
    $("#back_to_main_event").on('click', () => {
        $('#event_details').hide();
        $('#main_events_page').show();
    });
    
    /*
        Fill the list with the events of the selected month
    */
    function loadEventList() {
        
        $('#event_list').empty();
        
        var ref = firebase.database().ref('event/');
        ref.orderByChild("date").startAt(startdate.getTime()).endAt(enddate.getTime())
        .once("value", snap => {
            snap.forEach(childSnap => {
                
                var event_key = childSnap.key;
                var title;
                var event_date;
                var hour;
                var teacher;
                var teacher_key;
                var classroom;
                var classroom_key;
                
                childSnap.forEach(gcSnap => {
                    if (gcSnap.key == 'title') {
                        $('#event_list').append('<button type="button" id="ed_'+childSnap.key+'" class="list-group-item"">'+ gcSnap.val() +'</button>');
                        title = gcSnap.val();
                    } else if (gcSnap.key == 'date') {
                        event_date = new Date(gcSnap.val());
                    } else if (gcSnap.key == 'starting_hour') {
                        hour = gcSnap.val();
                    } else if (gcSnap.key == 'teacher') {
                        teacher = gcSnap.val();
                    } else if (gcSnap.key == 'classroom') {
                        classroom = gcSnap.val();
                    } else if (gcSnap.key == 'teacher_key') {
                        teacher_key = gcSnap.val();
                    } else if (gcSnap.key == 'classroom_key') {
                        classroom_key = gcSnap.val();
                    }
                });
                
                /*
                    Attach a listener for each event listed to retrive the informations about the event,
                    add a class to partecipate or (if the user created the event or has admin privileges)
                    remove the event.
                */
                $("#ed_"+childSnap.key+"").on('click', () => {
                    $('#event_list').empty();
                    $("#ed_title").text(title);
                    $("#ed_date").text('Data evento: '+event_date.getDate() + '/' + (event_date.getMonth() + 1 )+ '/' + event_date.getFullYear());
                    $("#ed_starting_hour").text('Ora di inizio: '+hour);
                    $("#ed_organizer").text('Organizzatore: '+teacher);
                    $("#ed_classroom").text('Luogo evento: '+classroom);
                    
                    var user = firebase.auth().currentUser;
                    if (isAdmin(user.uid) || user.uid == teacher_key) {
                        $("#delete_event").on('click', () => {
                            deleteEvent(childSnap.key, event_date, classroom_key);
                        });
                        
                        $("#delete_event").show();
                    }
                    
                    $("#save_event").on('click', () => {
                        var class_name = $("#event_class").find(':selected').text();
                        
                        if (class_name != 'Seleziona classe') {
                            firebase.database().ref('class/'+class_name+'/event/'+event_key+'/').set({
                                title : title,
                                event_date : event_date.getDate() + '/' + (event_date.getMonth() + 1) + '/' + event_date.getFullYear()
                            }).then(() => {
                                alert('Prenotazione effettuata');
                                loadEventList();
                                $('#event_details').hide();
                                $('#main_events_page').show();
                            });
                        } else {
                            alert ('Seleziona una classe');
                        }
                    });
                    
                    $('#main_events_page').hide();
                    $('#event_details').show();
                });
            });
        });
    }
    
    function deleteEvent(event_key, event_date, event_classroom_key) {
        
        var ref_prenotation = firebase.database().ref('prenotation/'+event_date.getFullYear() + '/' + (event_date.getMonth() + 1) + '/' + event_date.getDate() + '/' + event_classroom_key + '/');

        ref_prenotation.once('value', snap => {
            snap.forEach(childSnap => {
                childSnap.forEach(gcSnap => {
                    if (gcSnap.key == 'event_key') {
                        if (event_key == gcSnap.val()) {
                            ref_prenotation.child(childSnap.key).remove();
                        }
                    }
                });
            });
        });

        var ref_event = firebase.database().ref('event/');
        ref_event.child(event_key).remove();
        $('#event_details').hide();
        loadEventList();
        $('#main_events_page').show();
    }

    function isAdmin(userId) {
        const ref = firebase.database().ref('user/'+userId+'/admin');
        var isAdmin = false;
        ref.once('value', snap => {
            if (snap.val() == true) {
                isAdmin = true;
            } else {
                isAdmin = false;
            }
        });
        return isAdmin;
    }
    
/************************ new event ************************/
    const eventTitle = $('#event_title')[0];
    var ne_date;
    var classroom_name;
    var classroom_id;
    var cs_selected_rows = 0;
    var selected_hours = [];

    jQuery('#datetimepicker3').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#update-new-event-btn').on('click', () => {
        ne_date = $("#datetimepicker3").datetimepicker('getValue');
        classroom_id = $("#select_event_classroom").val();
        classroom_name = $("#select_event_classroom").find(':selected').text();
        if (classroom_name != "Seleziona aula" && ne_date != null) {
            loadClassroomSchedule();
        }
    });
    
    $('#new_event_btn').on('click', () => {
        $('#main_events_page').hide();
        $('#new_event_page').show();
        $('#event_title').text('');
    });
    
    $('#abort_event_btn').on('click', () => {
        $('#new_event_page').hide();
        $('#main_events_page').show();
        $("#schedule_event_table_body").empty();
        
        selected_hours = [];
        cs_selected_rows = 0;
    });
    
    $('#schedule_event_table').on('click', '.clickable-row', function(event){
        var idx;
        if ($(this).hasClass('selected_row')) {
            $(this).removeClass('selected_row');
            idx = selected_hours.indexOf($(this).attr('value'));
            if (idx >= 0) selected_hours.splice(idx, 1);
            cs_selected_rows--;
        } else if (!$(this).hasClass('selected_row') && !$(this).hasClass('mybook') && !$(this).hasClass('event_prenotation')) {
            $(this).addClass('selected_row');
            selected_hours.push($(this).attr('value'));
            cs_selected_rows++;
        }
    });
    
    $('#create_event_btn').on('click', () => {
        var today = Date.now() - (24*3600*1000);
        user = firebase.auth().currentUser;
        
        if (cs_selected_rows > 0 && ne_date >= today &&  eventTitle.value != "") {
            var event_prenotation = firebase.database().ref('event/').push({
                title : eventTitle.value,
                classroom : classroom_name,
                classroom_key : classroom_id,
                date : ne_date.getTime(),
                teacher : user.displayName,
                teacher_key : user.uid,
                starting_hour : selected_hours[0]
            });
            
            for (var i = 0; i < selected_hours.length; i++) {            
                firebase.database().ref('prenotation/'+year+'/'+month+'/'+day+'/'+classroom_id+'/'+selected_hours[i]+'/').set({
                event_key : event_prenotation.key,
                event : eventTitle.value,
                classroom : classroom_name
                });
            }
            
            loadEventList();
            
            alert('Nuovo evento creato\nTitolo evento:  '+ eventTitle.value + '\nGiorno:  ' + day + '/' + month + '/' + year + '\nAula:  ' + classroom_name + '\nOra di inizio:  ' + selected_hours[0] + ':00');
            
            selected_hours = [];
            cs_selected_rows = 0;
            
            $('#new_event_page').hide();
            $('#main_events_page').show();
            $("#schedule_event_table_body").empty();
            
        } else if (ne_date < today) {
            alert('ERRORE: Non possono essere effettuate modifiche per la data selezionata.');
        }
    });
    
    function loadClassroomSchedule() {
        day = ne_date.getDate();
        month = ne_date.getMonth() + 1;
        year = ne_date.getFullYear();

        $("#schedule_event_table_body").empty();
        
        for (var hour = 8; hour<16; hour++) {
            $("#schedule_event_table_body").append(
            '<tr class="clickable-row" id="hid_'+hour+'" value="'+hour+'">'+
            '<th>'+hour+':00</th><td></td>'+
            '</tr>');
        }
        
        var pRef = firebase.database().ref('/prenotation/'+year+'/'+month+'/'+day+'/'+classroom_id+'/');
        pRef.once('value', snap => {
            
            snap.forEach(childSnap => {
                var hour = childSnap.key;
                var hour;
                var teacher_name;
                var class_name;
                var event_title;
                var teacher_id;
                var event_key;
                var classroom;
                var second_column;
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
                    } else if (gcSnap.key == 'classroom') {
                        classroom = gcSnap.val();
                    }
                });
                
                if (classroom != 'Esterno') {
                    if (event_title) {
                        second_column = event_title;
                    } else {
                        second_column = class_name + ' ' + teacher_name;
                    }

                    $("#hid_"+hour).empty();
                    $("#hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');
                    user = firebase.auth().currentUser;
                    $("#hid_"+hour).empty();
                    $("#hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');

                    if (event_title) {
                        $("#hid_"+hour).addClass('event_prenotation');
                        $("#hid_"+hour).val(event_key);              
                    } else {
                        user = firebase.auth().currentUser;

                        if (user.uid == teacher_id){
                            $("#hid_"+hour).addClass('mybook');
                        } else {
                            $("#hid_"+hour).addClass('booked');
                            $("#hid_"+hour).removeClass('clickable-row');
                        }
                    }
                }
            });
        });
    }
});