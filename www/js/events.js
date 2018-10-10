const MonthsEnum = {GENNAIO : 1, FEBBRAIO : 2, MARZO : 3, APRILE : 4, MAGGIO : 5, GIUGNO : 6, LUGLIO : 7, AGOSTO : 8, SETTEMBRE : 9, OTTOBRE : 10, NOVEMBRE : 11, DICEMBRE : 12, properties : {
    1 : {name: 'Gennaio'}, 2 : {name: 'Febbraio'}, 3 : {name: 'Marzo'}, 4 : {name: 'Aprile'}, 5 : {name: 'Maggio'}, 6 : {name: 'Giugno'}, 7 : {name: 'Luglio'}, 8 : {name: 'Agosto'}, 9 : {name: 'Settembre'},  10 : {name: 'Ottobre'}, 11 : {name: 'Novembre'}, 12 : {name: 'Dicembre'}
}};

var EventsManagement = {
    ne_date : '',
    classroom_name : '',
    classroom_id : '',
    cs_selected_rows : 0,
    selected_hours : [],

    loadEventList : function () {
        $('#event_list').empty();
        var year = Number($("#select_year").find(':selected').text());
        var month = Number($("#select_month").find(':selected').val());
        var startdate = new Date(year, month - 1, 1);
        var enddate = new Date(year, month, 0);

        var ref = firebase.database().ref().child('event/');
        ref.orderByChild("date").startAt(startdate.getTime()).endAt(enddate.getTime())
        .once("value", snap => {
            snap.forEach(childSnap => {
                var event_key = childSnap.key;
                var title = childSnap.val().title;
                var event_date = new Date(childSnap.val().date);
                var hour  = childSnap.val().starting_hour;
                var teacher = childSnap.val().teacher;
                var teacher_key = childSnap.val().teacher_key;
                var classroom = childSnap.val().classroom;
                var classroom_key = childSnap.val().classroom_key; 
                
                $('#event_list').append('<button type="button" id="ed_'
                + event_key +'" class="list-group-item">'
                + title + ' - ' 
                + event_date.getDate() + '/' 
                + (event_date.getMonth() + 1) + '/' 
                + event_date.getFullYear() +'</button>');
                    /*
                    Attach a listener for each event listed to retrive the informations about the event,
                    add a class to partecipate or (if the user created the event or has admin privileges)
                    remove the event.
                    */
                $("#ed_"+event_key+"").click(function(event) {
                    $("#delete_event").off();
                    $("#save_event").off();
                    
                    var id = event.target.id;
                    var current_key = id.substring(id.indexOf("_") + 1);
                    var current_date = event_date;
                    $('#event_list').empty();
                    $("#ed_title").text(title);
                    $("#ed_date").text('Data evento: '
                    + current_date.getDate() + '/' 
                    + (current_date.getMonth() + 1 )+ '/' 
                    + current_date.getFullYear());
                    $("#ed_starting_hour").text('Ora di inizio: '+ hour);
                    $("#ed_organizer").text('Organizzatore: '+ teacher);
                    $("#ed_classroom").text('Luogo evento: '+ classroom);
                    
                    var user = firebase.auth().currentUser;
                    
                    if (isAdmin(user.uid) || user.uid == teacher_key) {
                        
                        $("#delete_event").on('click', () => {
                            if (classroom_name != "Esterno") {
                                EventsManagement.deleteEvent(current_key, current_date, classroom_key);
                            } else {
                                EventsManagement.deleteEvent(current_key, current_date);
                            }
                        });
                        $("#delete_event").show();

                        $("#save_event").on('click', () => {
                            EventsManagement.participateEvent($("#event_class").find(':selected').text(), current_key, event_date, title);
                            EventsManagement.loadEventList();
                        });

                        $("#save_event").show();
                        $("#event_class").show();
                    } else {
                        $("#event_class").hide();
                    }

                    $('#main_events_page').hide();
                    $('#event_details').show();
                });
            });
        });
    },

    participateEvent : function (class_name, event_key, event_date, event_title) {
        if (class_name != 'Seleziona classe') {
            var date = event_date.getDate() + '-' + (event_date.getMonth() + 1) + '-' + event_date.getFullYear();
            firebase.database().ref().child('class/'+class_name+'/event/'+event_key).update({
                date : date,
                title : event_title
            });

            var number_of_students;
            firebase.database().ref().child('class/'+class_name).once('value', snap => {
               return number_of_students = snap.val().number_of_students;
            }).then(() => {
                firebase.database().ref().child('event/'+event_key+'/class').update({
                    [class_name] : number_of_students
                });
            });

            $('#event_details').hide();
            $('#main_events_page').show();
            alert('Prenotazione effettuata');
        } else {
            alert ('Seleziona una classe');
        }
    },

    deleteEvent : function (event_key, event_date, event_classroom_key) {
        firebase.database().ref().child('event/'+event_key+'/class/').once('value', snap => {
            snap.forEach(childSnap => {
                firebase.database().ref().child('class/'+ childSnap.key+'/event/'+event_key).remove();
            });
        }).then(() => {
            var event_ref = firebase.database().ref().child('event/');
            event_ref.child(event_key).remove();
        });

        if (event_classroom_key != null) {
            var ref_prenotation = firebase.database().ref().child('prenotation/'
            + event_date.getFullYear() + '/' 
            + (event_date.getMonth() + 1) + '/' 
            + event_date.getDate() + '/' 
            + event_classroom_key + '/');

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
        }
        
        $('#event_details').hide();
        $('#main_events_page').show();
        EventsManagement.loadEventList();
    },

    loadClassroomSchedule : function () {
        day = EventsManagement.ne_date.getDate();
        month = EventsManagement.ne_date.getMonth() + 1;
        year = EventsManagement.ne_date.getFullYear();

        $("#schedule_event_table_body").empty();
        
        for (var hour = 8; hour<25; hour++) {
            $("#schedule_event_table_body").append(
            '<tr class="clickable-row" id="ev_hid_'+hour+'" value="'+hour+'">'+
            '<th>'+hour+':00</th><td></td>'+
            '</tr>');
        }
        
        var pRef = firebase.database().ref().child('/prenotation/'+year+'/'+month+'/'+day+'/'+EventsManagement.classroom_id+'/');
        pRef.once('value', snap => {
            
            snap.forEach(childSnap => {
                var hour = childSnap.key;
                var teacher_name = childSnap.val().teacher;
                var class_name = childSnap.val().class;
                var event_title = childSnap.val().event;
                var teacher_id = childSnap.val().teacher_key;
                var event_key = childSnap.val().event_key;
                var classroom = childSnap.val().classroom;
                var second_column;
                
                if (classroom != 'Esterno') {
                    if (event_title) {
                        second_column = event_title;
                    } else {
                        second_column = class_name + ' ' + teacher_name;
                    }

                    $("#ev_hid_"+hour).empty();
                    $("#ev_hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');
                    user = firebase.auth().currentUser;
                    $("#ev_hid_"+hour).empty();
                    $("#ev_hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');

                    if (event_title) {
                        $("#ev_hid_"+hour).addClass('event_prenotation');
                        $("#ev_hid_"+hour).val(event_key);              
                    } else {
                        user = firebase.auth().currentUser;

                        if (user.uid == teacher_id){
                            $("#ev_hid_"+hour).addClass('mybook');
                        } else {
                            $("#ev_hid_"+hour).addClass('booked');
                            $("#ev_hid_"+hour).removeClass('clickable-row');
                        }
                    }
                }
            });
        });
    },

    loadMonthAndYear : function () {
        var d = new Date();
        const start_year = 2018;
        const current_year = d.getFullYear();
        var year = start_year;
        var month = d.getMonth() + 1;
        
        $('#select_month').empty();
        for (var i  = 1; i <= 12 ; i++) {
            if (i == month) {
                $('#select_month').append('<option selected="selected" value="'+i+'">'+ MonthsEnum.properties[i].name +'</option>');
            } else {
                $('#select_month').append('<option value="'+i+'">'+ MonthsEnum.properties[i].name +'</option>');
            }
        }      
        
        $('#select_year').empty();
        while (year < current_year + 2) {
            if (year == current_year) {
                $('#select_year').append('<option selected="selected">'+ year +'</option>');
            } else {
                $('#select_year').append('<option>'+ year +'</option>');
            }
            year++;
        }        
    },

    updateEventPageData : function () {
        EventsManagement.ne_date = $("#datetimepicker3").datetimepicker('getValue');
        EventsManagement.classroom_id = $("#select_event_classroom").val();
        EventsManagement.classroom_name = $("#select_event_classroom").find(':selected').text();
        if (EventsManagement.classroom_name != "Seleziona aula" && EventsManagement.ne_date != null) {
            EventsManagement.loadClassroomSchedule();
        }
    },

    createEvent : function () {
        var today = Date.now() - (24*3600*1000);
        user = firebase.auth().currentUser;
        
        if (EventsManagement.cs_selected_rows > 0 && EventsManagement.ne_date >= today &&  $('#event_title')[0].value != "") {
            var mydate = EventsManagement.ne_date;
            var event_prenotation = firebase.database().ref().child('event/').push({
                title : $('#event_title')[0].value,
                classroom : EventsManagement.classroom_name,
                classroom_key : EventsManagement.classroom_id,
                date : mydate.getTime(),
                teacher : user.displayName,
                teacher_key : user.uid,
                starting_hour : EventsManagement.selected_hours[0]
            });
            if (EventsManagement.classroom_name != "Esterno") {
                for (var i = 0; i < EventsManagement.selected_hours.length; i++) {            
                    firebase.database().ref().child('prenotation/'
                    + year+'/'
                    + month+'/'
                    + day+'/'
                    + EventsManagement.classroom_id+'/'
                    + EventsManagement.selected_hours[i]+'/').set({
                    event_key : event_prenotation.key,
                    event : $('#event_title')[0].value,
                    classroom : EventsManagement.classroom_name
                    });
                }
            }
            
            EventsManagement.loadEventList();
            
            alert('Nuovo evento creato\nTitolo evento:  '
            + $('#event_title')[0].value + '\nGiorno:  ' 
            + day + '/' 
            + month + '/' 
            + year + '\nAula:  ' 
            + EventsManagement.classroom_name + '\nOra di inizio:  ' 
            + EventsManagement.selected_hours[0] + ':00');
            
            EventsManagement.selected_hours = [];
            EventsManagement.cs_selected_rows = 0;
            
            $('#new_event_page').hide();
            $('#main_events_page').show();
            $("#schedule_event_table_body").empty();
            
        } else if (ne_date < today) {
            alert('ERRORE: Non possono essere effettuate modifiche per la data selezionata.');
        }
    }
}

$(function () {
    EventsManagement.loadMonthAndYear();

    /************************ show events ************************/

    $('#select_month, #select_year').on('change', () => {
        EventsManagement.month = $("#select_month").find(':selected').val();
        EventsManagement.year = $("#select_year").find(':selected').text();
        EventsManagement.loadEventList();
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
        $("#delete_event").hide();
        $("#save_event").hide();
        $("#event_class").hide();
        EventsManagement.loadEventList();
    });
    
    /************************ new event ************************/
    jQuery('#datetimepicker3').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#select_event_page, #select_event_classroom, #datetimepicker3').on('change', () => {
        EventsManagement.updateEventPageData();
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
        EventsManagement.loadEventList();
        EventsManagement.selected_hours = [];
        EventsManagement.cs_selected_rows = 0;
    });
    
    $('#schedule_event_table').on('click', '.clickable-row', function(event) {
        var idx;
        if ($(this).hasClass('selected_row')) {
            $(this).removeClass('selected_row');
            idx = EventsManagement.selected_hours.indexOf($(this).attr('value'));
            if (idx >= 0) EventsManagement.selected_hours.splice(idx, 1);
            cs_selected_rows--;
        } else if (!$(this).hasClass('selected_row') && !$(this).hasClass('mybook') && !$(this).hasClass('event_prenotation')) {
            $(this).addClass('selected_row');
            EventsManagement.selected_hours.push($(this).attr('value'));
            EventsManagement.cs_selected_rows++;
        }
    });
    
    $('#create_event_btn').on('click', () => {
        EventsManagement.createEvent();
    });
    
});