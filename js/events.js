var EventsManagement = {
    ne_date : '',
    classroom_name : '',
    classroom_id : '',
    cs_selected_rows : 0,
    selected_hours : [],
    selected_class : [],
    selected_event : null,
    newEventClassSelection : new CheckboxClassSelectDropdown("new_event_dropdown"),
    dettailsEventClassSelection : new CheckboxClassSelectDropdown("event_dettails_dropdown"),

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
                var inBacheca = childSnap.val().bacheca;
                var USER = firebase.auth().currentUser;

                if (USER) {
                    firebase.database().ref('user/' + USER.uid).once('value', snap => {
                        if (snap.val().priviledges == "1" || USER.uid == teacher_key) {
                            $('#event_list').append('<div class="list-group-item event_list"><div id="ed_'
                            + event_key +'">'
                            + title + ' - ' 
                            + event_date.getDate() + '/' 
                            + (event_date.getMonth() + 1) + '/' 
                            + event_date.getFullYear() +'</div><button id="del_btn_'+ event_key +'" value="'+ event_key +'" type="button" class="btn btn-primary del_btn_event">Elimina</button></div>');

                            $('.del_btn_event').click(function() {
                                selected_event = $(this).val();
                                $('#deleteEventModal').modal();
                            });
                            /*
                            Attach a listener for each event listed to retrive the informations about the event,
                            add a class to partecipate or (if the user created the event or has admin privileges)
                            remove the event.
                            */
                            $("#ed_"+event_key+"").click(function(event) {
                                EventsManagement.selected_event = event_key;
                                EventsManagement.dettailsEventClassSelection.loadClasses(event_key, EventsManagement.selected_class);

                                $("#back_to_main_event").on('click', () => {
                                    EventsManagement.dettailsEventClassSelection.applySelection(EventsManagement.selected_event, EventsManagement.selected_class);
                                    EventsManagement.selected_class = [];
                                });
                                
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
                                
                                $("#ed_starting_hour").text('- '+ SPECIAL_HOURS[hour]);
                                $("#ed_organizer").text('- '+ teacher);
                                $("#ed_classroom").text('- '+ classroom);
                                $('#desc_title').empty();
                                $('#desc_text').empty();
                                $('#desc_title').append('<div class="form-group"><input type="text" class="form-control" id="event_title_text" value="'+title+'"></div>');
                                $('#desc_text').append('<div class="form-group"><textarea class="form-control" rows="5" id="event_desc_txt_area">'+description+'</textarea></div>');
                                $('#check_event_det').prop("checked", inBacheca);
                                $('#mod_event_desk').on('click', () => {
                                    EventsManagement.modifyEvent(selected_event, $('#event_title_text').val(), $('#event_desc_txt_area').val());
                                    $("#ed_title").text('- ' + $('#event_title_text').val());
                                });

                                $('#check_event_det').on('change', () => {
                                    firebase.database().ref('event/'+EventsManagement.selected_event).update({
                                        bacheca : $('#check_event_det').is(':checked')
                                    });
                                });
                                
                                var user = firebase.auth().currentUser;
                                firebase.database().ref('user/'+user.uid).once('value', snap => {
                                    var level = snap.val().priviledges + '';
                                    if (level == 1 || user.uid == teacher_key) {
                                        $("#safe_delete_event_btn").show();
                                        $("#save_event").hide();
                                        $("#delete_event").on('click', () => {
                                            EventsManagement.deleteEvent(current_key, classroom_key);
                                            EventsManagement.loadEventList();
                                            $("#safe_delete_event_btn").text('Elimina evento');
                                            $("#delete_event").slideUp();
                                            $('#event_details').hide();
                                            $('#main_events_page').show();
                                        });
                                    }
                                });

                                $('#main_events_page').hide();
                                $('#event_details').show();
                            });
                        }
                    });
                }
            });
        });
    },

    modifyEvent(event_key, titletext, desctext) {
        firebase.database().ref('event/'+event_key).update({
            title : titletext,
            description : desctext
        });
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
                var class_name = childSnap.val().class_name;
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
        var event_title = $('#event_title')[0].value;
        var event_description = $.trim($("#e_desc").val());
        user = firebase.auth().currentUser;
        if ((EventsManagement.cs_selected_rows > 0 || EventsManagement.classroom_name == "Esterno") && EventsManagement.ne_date >= today &&  event_title != "") {
            $("#schedule_event_table").hide();
            var mydate = EventsManagement.ne_date;
            var rDate = mydate.getDate() + '-' + (mydate.getMonth()+1) + '-' + mydate.getFullYear();
            var event_prenotation = firebase.database().ref().child('event/').push({
                title : event_title,
                classroom : EventsManagement.classroom_name,
                classroom_key : EventsManagement.classroom_id,
                date : mydate.getTime(),
                period : {
                    date0 : mydate.getTime()
                },
                bacheca : $('#check_event_creation').is(':checked'),
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
                    event : event_title,
                    classroom : EventsManagement.classroom_name
                    });
                }
            }

            EventsManagement.newEventClassSelection.applySelection(event_prenotation.key, EventsManagement.selected_class);
            EventsManagement.selected_class = [];

            EventsManagement.loadEventList();
            alert('Nuovo evento creato\nTitolo evento:  '
            + $('#event_title')[0].value + '\nGiorno:  ' 
            + day + '/' 
            + month + '/' 
            + year + '\nAula:  ' 
            + EventsManagement.classroom_name);
            
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
    },

    addElem : function (elem) {
        if (!this.selected_class.includes(elem)) {
            this.selected_class.push(elem);
        }
    },

    removeElem : function  (elem) {
        if (this.selected_class.includes(elem)) {
            var index = this.selected_class.indexOf(elem);
            if (index > -1) {
                this.selected_class.splice(index, 1);
            }
        }
    },

    newEvent : function (title, description, date, teacher) {
        
    }
}

class Event {
    constructor(title, description, organizer) {
        this.title = title;
        this.description = description;
        this.organizer = organizer;
        this.date = [];
    }

    /**
     *  date_1 : {
     *      class : {
     *          class_id_1 : class_name_1,
     *          class_id_2 : class_name_2,
     *          ...
     *          ...
     *      },
     *      place : {   
     *                  type : internal / external
     *                  classroom_id : classroom_id,
     *                  classroom_name : classroom_name,
     *                              or
     *                  place_name : place_name
     *      },
     *      hour : [8, 9, 10, ...]
     *  }
     */
    addDate(date) {
        this.date.push(date);
    }

    getJsonObj() {
        var jobj = '{' +
        '"title" : '+ this.title+',' + 
        '"description" : "'+ this.description+ '",' + 
        '"organizer" : { id : "' + this.organizer.id + '", "name" : "'+ this.organizer.name +'"},'+
        '"date" : {';

        this.date.forEach(eventDate => {
            jobj += '"'+eventDate.date.date+'"' + ': { "class" : [';
            eventDate.classes.forEach(eventClass => {
                jobj += '"'+eventClass.id+'" : "'+ eventClass.name+'",';
            });
            jobj = jobj.substring(0, jobj.length - 1);
            jobj += '], "place" : { "internal" : '+ eventDate.place.isInternal()+', ';
            if (eventDate.place.isInternal()) {
                jobj +='"name" : "' + eventDate.place.place.name +'", "id" : "' + eventDate.place.id +'"},';
            } else {
                jobj +='"name" : "' + eventDate.place.place +'"},';
            }
            jobj += '"hour : ["';
            eventDate.hours.forEach(hour => {
                jobj += '"' + hour + '", ';
            });
            jobj = jobj.substring(0, jobj.length - 1);
            jobj += ']},'
        });
        jobj = jobj.substring(0, jobj.length - 1);
        jobj += '}}';

        return jobj;

        /*
        {
            "title" : EventTestTitle,
            "description" : "EventTestDescription",
            "organizer" : { id : "007", "name" : "James Bond"},
            "date" : {
                "undefined": { 
                    "class" : ["001" : "1A","002" : "1B"],
                    "place" : { "internal" : false, "name" : "Milano"},
                    "hour : [""8", "9", "10", "11",]
                }
            }
        }
        */
    }
}

class EventDate {
    constructor(date, classes, place, hours) {
        this.date = date;
        this.classes = classes;
        this.place = place;
        this.hours = hours;
    }

    addClass(InstituteClass) {
        /*ToDo:
            check whether the class is already present by id and
            add it if not.
        */
    }

    removeClass(InstituteClass) {
        /*ToDo:
            check whether the class is already present by id and
            remove it is.
        */
    }
}

class EventPlace {
    constructor(classroom, placeName) {
        if (placeName === undefined) {
            this.type = "INT"
            this.place = classroom;
        } else if (classroom === undefined) {
            this.type = "EXT"
            this.place = placeName;
        }
    }

    isInternal() {
        return (this.type == 'INT');
    }
}

class Teacher {
    constructor(teacher_id, teacher_name) {
        this.id = teacher_id;
        this.name = teacher_name;
    }
}

class Classroom {
    constructor(classroom_id, classroom_name) {
        this.id = classroom_id;
        this.name = classroom_name;
    }
}

class InstituteClass {
    constructor(class_id, class_name) {
        this.id = class_id;
        this.name = class_name;
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

    $('#quick_delet_event_btn').on('click', () => {
        firebase.database().ref('event/'+ selected_event).once('value', snap => {
            var classroom_key = snap.val().classroom_key;
            EventsManagement.deleteEvent(selected_event, classroom_key);
        })
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
        var event = new Event('EventTestTitle', 'EventTestDescription', new Teacher('007', 'James Bond'));
        event.addDate(new EventDate(new Date().getTime(), [new Classroom("001", "1A"), new Classroom("002", "1B")], new EventPlace(undefined, "Milano"), [8, 9, 10, 11]));
        console.log(event.getJsonObj());
        /*
        EventsManagement.selected_class = [];
        EventsManagement.newEventClassSelection.loadClasses(null, null);
        $('#main_events_page').hide();
        $('#new_event_page').show();
        $('#event_title').text('');*/
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

function onClickHandler(cb) {
    if (cb.checked) {
        EventsManagement.addElem($(cb).val());
        AdvancedOperations.addElem($(cb).val());
    } else {
        EventsManagement.removeElem($(cb).val());
        AdvancedOperations.removeElem($(cb).val());
    }
}