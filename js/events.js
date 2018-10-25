/*const MonthsEnum = {GENNAIO : 1, FEBBRAIO : 2, MARZO : 3, APRILE : 4, MAGGIO : 5, GIUGNO : 6, LUGLIO : 7, AGOSTO : 8, SETTEMBRE : 9, OTTOBRE : 10, NOVEMBRE : 11, DICEMBRE : 12, properties : {
    1 : {name: 'Gennaio'}, 2 : {name: 'Febbraio'}, 3 : {name: 'Marzo'}, 4 : {name: 'Aprile'}, 5 : {name: 'Maggio'}, 6 : {name: 'Giugno'}, 7 : {name: 'Luglio'}, 8 : {name: 'Agosto'}, 9 : {name: 'Settembre'},  10 : {name: 'Ottobre'}, 11 : {name: 'Novembre'}, 12 : {name: 'Dicembre'}
}};*/

var EventsManagement = {
    ne_date : '',
    classroom_name : '',
    classroom_id : '',
    cs_selected_rows : 0,
    selected_hours : [],

    loadEventList : function () {
        $('#event_list').empty();
        var tmp_date = $("#datetimepicker6").datetimepicker('getValue');

        if (tmp_date == null) {
            tmp_date = new Date();
        }

        var month = tmp_date.getMonth() + 1;
        var year = tmp_date.getFullYear();

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
                var description = childSnap.val().description;

                this.selected_event_key = event_key;

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
                    $("#ed_title").text('- ' + title);
                    $("#ed_date").text('- '
                    + current_date.getDate() + '/' 
                    + (current_date.getMonth() + 1 )+ '/' 
                    + current_date.getFullYear());

                    EventsManagement.printClasses(event_key);
                    
                    $("#ed_starting_hour").text('- '+ SPECIAL_HOURS[hour]);
                    $("#ed_organizer").text('- '+ teacher);
                    $("#ed_classroom").text('- '+ classroom);
                    $('#desc_title').empty();
                    $('#desc_text').empty();
                    $('#desc_title').append(title);
                    $('#desc_text').append(description);

                    var user = firebase.auth().currentUser;

                    firebase.database().ref('user/'+user.uid).once('value', snap => {
                        var level = snap.val().priviledges + '';
                        if (level == 3 || user.uid == teacher_key) {

                            $("#safe_delete_event_btn").show();
                            $("#save_event").hide();
                            $("#event_class").show();
                            
                            $("#delete_event").on('click', () => {
                                if (classroom_name != "Esterno") {
                                    EventsManagement.deleteEvent(current_key, classroom_key);
                                } else {
                                    EventsManagement.deleteEvent(current_key);
                                }

                                $("#safe_delete_event_btn").text('Elimina evento');
                                $("#delete_event").slideUp();
                            });

                            $('#save_event').on('click', () => {
                                var class_name = $("#event_class").find(':selected').text();
                                if ($('#save_event').text() == 'Rimuovi classe') {
                                    EventsManagement.cancelPartecipation(class_name, event_key);
                                    EventsManagement.printClasses(event_key);
                                    $('#save_event').text('Aggiungi classe');
                                } else {
                                    EventsManagement.participateEvent(class_name, current_key, event_date, title);
                                    EventsManagement.printClasses(event_key);
                                    $('#save_event').text('Rimuovi classe');
                                }
                            });

                            $("#event_class").on('change', () => {
                                var class_name = $("#event_class").find(':selected').text();
                                if (class_name != 'Seleziona classe' && event_key != '') {
                                    var event_classes = [];
                                    firebase.database().ref('event/'+ event_key +'/class/').once('value', snap => {
                                        snap.forEach(childSnap => {
                                            event_classes.push(childSnap.key);
                                        });
                                    }).then(() => {
                                        if (event_classes.includes(class_name)) {
                                            $('#save_event').text('Rimuovi classe');
                                        } else {
                                            $('#save_event').text('Aggiungi classe');
                                        }
                                    });
                                    $("#save_event").slideDown();
                                } else {
                                    $("#save_event").slideUp();
                                }
                            });
                        } else {
                            $("#event_class").hide();
                        }
                    });

                    $('#main_events_page').hide();
                    $('#event_details').show();
                });
            });
        });
    },

    printClasses : function (event_key) {
        var classes = [];
        firebase.database().ref('event/' + event_key + '/class').once('value', snap => {
            snap.forEach(childSnap => {
                classes.push(childSnap.key);
            });
        }).then(() => {
            var str_classes = '';
            for (i in classes) {
                    if (i == classes.length - 1) {
                    str_classes += classes[i] + '.';
                } else {
                    str_classes += classes[i] + ', ';
                }
            }
            $('#event_classes').empty();
            $('#event_classes').append(str_classes);
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
        } else {
            alert ('Seleziona una classe');
        }
    },

    cancelPartecipation : function (class_name, event_key)  {
        firebase.database().ref('event/'+ event_key +'/class/'+class_name).remove();
        firebase.database().ref('class/'+class_name+'/event/'+event_key).remove();
    },

    deleteEvent : function (event_key, event_classroom_key) {
        firebase.database().ref().child('event/'+event_key+'/class/').once('value', snap => {
            snap.forEach(childSnap => {
                firebase.database().ref().child('class/'+ childSnap.key+'/event/'+event_key).remove();
            });
        }).then(() => {
            if (event_classroom_key != null) {
                firebase.database().ref('event/'+ event_key +'/period/').once('value', snap => {
                    snap.forEach(childSnap => {
                        var e_date = new Date(childSnap.val());
                        var ref_prenotation = firebase.database().ref().child('prenotation/'
                        + e_date.getFullYear() + '/' 
                        + (e_date.getMonth() + 1) + '/' 
                        + e_date.getDate() + '/' 
                        + event_classroom_key + '/');
            
                        ref_prenotation.once('value', sbSnap => {
                            sbSnap.forEach(sbChildSnap => {
                                sbChildSnap.forEach(gcSnap => {
                                    if (gcSnap.key == 'event_key') {
                                        if (event_key == gcSnap.val()) {
                                            ref_prenotation.child(sbChildSnap.key).remove();
                                        }
                                    }
                                });
                            });
                        });
                    });
                }).then(() => {
                    var event_ref = firebase.database().ref().child('event/');
                    event_ref.child(event_key).remove();
                }).then(() => {
                    $('#event_details').hide();
                    $('#main_events_page').show();
                    EventsManagement.loadEventList();
                });
            }
        });

        
    },

    loadClassroomSchedule : function () {
        day = EventsManagement.ne_date.getDate();
        month = EventsManagement.ne_date.getMonth() + 1;
        year = EventsManagement.ne_date.getFullYear();

        $("#schedule_event_table_body").empty();
        
        for (var hour = 8; hour<25; hour++) {
            $("#schedule_event_table_body").append(
            '<tr class="clickable-row" id="ev_hid_'+hour+'" value="'+hour+'">'+
            '<th>'+SPECIAL_HOURS[hour]+'</th><td></td>'+
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
        var event_description = $.trim($("#e_desc").val());
        if ((EventsManagement.cs_selected_rows > 0 || EventsManagement.classroom_name == "Esterno") && EventsManagement.ne_date >= today &&  $('#event_title')[0].value != "") {
            
            $("#schedule_event_table").hide();
            
            var mydate = EventsManagement.ne_date;
            var rDate = mydate.getDate() + '-' + (mydate.getMonth()+1) + '-' + mydate.getFullYear();
            var event_prenotation = firebase.database().ref().child('event/').push({
                title : $('#event_title')[0].value,
                classroom : EventsManagement.classroom_name,
                classroom_key : EventsManagement.classroom_id,
                date : mydate.getTime(),
                period : {
                    date0 : mydate.getTime()
                },
                readableDate : rDate,
                teacher : user.displayName,
                teacher_key : user.uid,
                description : event_description
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
            + EventsManagement.selected_hours[0] + ':00');
            
            EventsManagement.selected_hours = [];
            EventsManagement.cs_selected_rows = 0;
            
            $('#new_event_page').hide();
            $('#main_events_page').show();
            $("#schedule_event_table_body").empty();
            $('#warning_event_creation').hide();
        } else if (EventsManagement.ne_date < today) {
            $('#warning_event_creation').slideDown();
            $('#warning_event_creation').text('Non possono essere effettuate modifiche per la data selezionata.');
        } else if ($('#event_title')[0].value == "") {
            $('#warning_event_creation').slideDown();
            $('#warning_event_creation').text('Inserisci un titolo per l\'evento.');
        } else if ($("#select_event_classroom").find(':selected').text() == 'Seleziona aula') {
            $('#warning_event_creation').slideDown();
            $('#warning_event_creation').text('Seleziona il luogo dove si svolgerà l\'evento.');
        } else if (EventsManagement.cs_selected_rows == 0) {
            if ($("#select_event_classroom").find(':selected').text() != 'Esterno') {
                $('#warning_event_creation').text('Seleziona l\'orario.');
            }
            $('#warning_event_creation').slideDown();
        }
    }
}

$(function () {
    /************************ show events ************************/
    jQuery('#datetimepicker6').datetimepicker({
        timepicker:false,
        format:'d M Y'
    });

    $('#datetimepicker6').on('change', () => {
        EventsManagement.loadEventList();
    });
    
    $("#safe_delete_event_btn").on('click', () => {
        if ($("#safe_delete_event_btn").text() == "Elimina evento") {
            $("#delete_event").slideDown();
            $("#safe_delete_event_btn").text('Annulla');
        } else {
            $("#safe_delete_event_btn").text('Elimina evento');
            $("#delete_event").slideUp();
        }
    });   
    
    $("#back_to_main_event").on('click', () => {
        $('#event_details').hide();
        $('#main_events_page').show();
        $("#safe_delete_event_btn").hide();
        $("#delete_event").hide();
        $("#save_event").hide();
        $("#event_class").hide();
        $('#warning_event_creation').hide();
        EventsManagement.loadEventList();
    });
    
    /************************ new event ************************/
    jQuery('#datetimepicker3').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#select_event_page, #select_event_classroom, #datetimepicker3').on('change', () => {
        EventsManagement.selected_hours = [];
        EventsManagement.cs_selected_rows = 0;
        EventsManagement.updateEventPageData();
    });

    $('#select_event_classroom').on('change', () => {
        $("#schedule_event_table").slideDown();
    });
    
    $('#new_event_btn').on('click', () => {
        $('#main_events_page').hide();
        $('#new_event_page').show();
        $('#event_title').text('');
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
        EventsManagement.updateEventPageData();
        EventsManagement.createEvent();
        $('#event_title').trigger('reset');
        $('#e_desc').trigger('reset');
    });

    $('#abort_event_btn').on('click', () => {
        $('#new_event_page').hide();
        $('#main_events_page').show();
        $("#schedule_event_table_body").empty();
        $("#schedule_event_table").hide();
        EventsManagement.loadEventList();
        EventsManagement.selected_hours = [];
        EventsManagement.cs_selected_rows = 0;
        $('#event_title').trigger('reset');
        $('#e_desc').trigger('reset');
        $('#warning_event_creation').hide();
        
    });

    $('#modal_link_event_desk').on('click', () => {
        $('#exampleModalLong').modal();
    });
});