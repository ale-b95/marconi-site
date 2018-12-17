var EventsManagement = {
    newEventClassSelection : new CheckboxClassSelectDropdown("new_event_dropdown"),

    init : function () {
        this.user = firebase.auth().currentUser;

        this.selectedHours = [];
        this.selectedClasses = [];
        this.nSelectedRows = 0;

        this.tempDate = new Date();
        this.classroomName = '';
        this.classroomId = '';
    
        this.selectedEvent = null;

        this.newEvent = new InstituteEvent();
        this.newEvent.setOrganizer(new Teacher(this.user.uid, this.user.displayName));
    },

    eventDateInit : function () {
        EventsManagement.selectedClasses = [];
        EventsManagement.selectedHours = [];
        EventsManagement.nSelectedRows = 0;
        EventsManagement.newEventClassSelection.loadClasses(null, null);
    },

    loadEventList : function () {
        /*$('#event_list').empty();
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

                if (this.user) {
                    firebase.database().ref('user/' + this.user.uid).once('value', snap => {
                        if (snap.val().priviledges == "1" || this.user.uid == teacher_key) {
                            $('#event_list').append('<div class="list-group-item event_list"><div id="ed_'
                            + event_key +'">'
                            + title + ' - ' 
                            + event_date.getDate() + '/' 
                            + (event_date.getMonth() + 1) + '/' 
                            + event_date.getFullYear() +'</div><button id="del_btn_'+ event_key +'" value="'+ event_key +'" type="button" class="btn btn-primary del_btn_event">Elimina</button></div>');

                            $('.del_btn_event').click(function() {
                                selectedEvent = $(this).val();
                                $('#deleteEventModal').modal();
                            });
                            
                            Attach a listener for each event listed to retrive the informations about the event,
                            add a class to partecipate or (if the user created the event or has admin privileges)
                            remove the event.
                            
                            $("#ed_"+event_key+"").click(function(event) {
                                EventsManagement.selectedEvent = event_key;
                                EventsManagement.dettailsEventClassSelection.loadClasses(event_key, EventsManagement.selectedClasses);

                                $("#back_to_main_event").on('click', () => {
                                    EventsManagement.dettailsEventClassSelection.applySelection(EventsManagement.selectedEvent, EventsManagement.selectedClasses);
                                    EventsManagement.selectedClasses = [];
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
                                    EventsManagement.modifyEvent(selectedEvent, $('#event_title_text').val(), $('#event_desc_txt_area').val());
                                    $("#ed_title").text('- ' + $('#event_title_text').val());
                                });

                                $('#check_event_det').on('change', () => {
                                    firebase.database().ref('event/'+EventsManagement.selectedEvent).update({
                                        bacheca : $('#check_event_det').is(':checked')
                                    });
                                });
                                
                                firebase.database().ref('user/'+this.user.uid).once('value', snap => {
                                    var level = snap.val().priviledges + '';
                                    if (level == 1 || this.user.uid == teacher_key) {
                                        $("#safe_delete_event_btn").show();
                                        $("#save_event").hide();
                                        $("#delete_event").on('click', () => {
                                            EventsManagement.deleteEvent(current_key, classroom_key);
                                            EventsManagement.loadEventList();
                                            $("#safe_delete_event_btn").text('Elimina evento');
                                            $("#delete_event").slideUp();
                                        });
                                    }
                                });
                            });
                        }
                    });
                }
            });
        });
        */
    },

    changeEventTitle : function () {
        //TODO
    },

    changeEventDescription : function () {
        //TODO
    },

    deleteEvent : function (event_key) {
        //TODO
    },

    loadClassroomSchedule : function () {
        $("#schedule_event_table_body").empty();
        for (var hour = 8; hour<22; hour++) {
            $("#schedule_event_table_body").append(
            '<tr class="clickable-row" id="ev_hid_'+hour+'" value="'+hour+'">'+
            '<th>'+SPECIAL_HOURS[hour]+'</th><td></td>'+
            '</tr>');
        }
        firebase.database().ref().child('/prenotation/'
            +EventsManagement.tempDate.getFullYear()+'/'
            +(EventsManagement.tempDate.getMonth() + 1)+'/'
            +EventsManagement.tempDate.getDate()+'/'
            +EventsManagement.classroomId).once('value', snap => {
            snap.forEach(childSnap => {
                var hour = childSnap.key;
                var event_title = childSnap.val().event;
                var second_column;
                
                if (childSnap.val().classroom != 'Esterno') {
                    if (event_title) {
                        second_column = event_title;
                    } else {
                        second_column = childSnap.val().class_name + ' ' + childSnap.val().teacher;
                    }

                    $("#ev_hid_"+hour).empty();
                    $("#ev_hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');
                    $("#ev_hid_"+hour).empty();
                    $("#ev_hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');

                    if (event_title) {
                        $("#ev_hid_"+hour).addClass('event_prenotation');
                        $("#ev_hid_"+hour).val(childSnap.val().event_key);              
                    } else {
                        this.user = firebase.auth().currentUser;

                        if (this.user.uid == childSnap.val().teacher_key){
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
        EventsManagement.selectedHours = [];
        EventsManagement.nSelectedRows = 0;
        EventsManagement.tempDate = $("#datetimepicker3").datetimepicker('getValue');
        EventsManagement.classroomId = $("#select_event_classroom").val();
        EventsManagement.classroomName = $("#select_event_classroom").find(':selected').text();

        if (EventsManagement.classroomName != "Seleziona aula") {
            if (EventsManagement.tempDate == null) {
                EventsManagement.tempDate = new Date();
            }
            EventsManagement.loadClassroomSchedule();
        }
    },

    createEvent : function () {
        this.newEvent.setTitle($('#event_title')[0].value);
        this.newEvent.setDescription($('#event_description')[0].value);

        if (this.newEvent.getTitle() == '' || this.newEvent.getTitle() == null) {
            alert('Inserire Titolo');
        } else if (this.newEvent.getDescription() == '' || this.newEvent.getDescription() == null) {
            alert('Inserire Descrizione');
        } else {
            firebase.database().ref('event').push(this.newEvent.getJsonObj()).then(() => {
                backPage();
            });
        }
    },

    resetForms : function () {
        $('#event_title').val('');
        $('#event_description').val('');
        this.eventDateResetForms();
    },

    eventDateResetForms : function () {
        $('#datetimepicker3').datetimepicker('reset');
        $("#event_place").hide();
        $("#event_place").val('');
        $("#schedule_event_table").hide();
    }
}

class InstituteEvent {
    constructor() {
        this.title = null;
        this.description = null;
        this.organizer = null;
        this.date = [];
    }

    setTitle(title) {
        this.title = title;
    }

    setDescription(description) {
        this.description = description;
    }

    setOrganizer(organizer) {
        this.organizer = organizer;
    }

    getTitle() {
        return this.title;
    }

    getDescription() {
        return this.description;
    }

    getOrganizer() {
        return this.organizer;
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
     *                  classroomId : classroomId,
     *                  classroomName : classroomName,
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
        '"title" : "'+ this.title+'",' + 
        '"description" : "'+ this.description+ '",' + 
        '"organizer" : { "id" : "' + this.organizer.id + '", "name" : "'+ this.organizer.name +'"},'+
        '"date" : [';

        this.date.forEach(eventDate => {
            jobj += '{"eventDate" : "'+eventDate.date+'", "class" : {';
            eventDate.classes.forEach(eventClass => {
                jobj += '"'+eventClass.id+'" : "'+ eventClass.name+'",';
            });
            jobj = jobj.substring(0, jobj.length - 1);
            jobj += '}, "place" : { "internal" : '+ eventDate.place.isInternal()+', ';
            if (eventDate.place.isInternal()) {
                jobj +='"name" : "' + eventDate.place.place.name +'", "id" : "' + eventDate.place.place.id +'"},';
            } else {
                jobj +='"name" : "' + eventDate.place.place +'"},';
            }
            jobj += '"hour" : [';
            eventDate.hours.forEach(hour => {
                jobj += '"' + hour + '",';
            });
            jobj = jobj.substring(0, jobj.length - 1);
            jobj += ']},'
        });
        if (jobj.substring(jobj.length-1) == ",") {
            jobj = jobj.substring(0, jobj.length - 1);
        }
        jobj += ']}';

        console.log(jobj);
        return JSON.parse(jobj);
    }
}

class EventDate {
    constructor(date) {
        this.date = date;
        this.classes = [];
        this.hours = [];
    }

    setClasses(classes) {
        this.classes = classes;
    }

    setPlace(place) {
        this.place = place;
    }

    setHours(hours) {
        this.hours = hours;
    }
}

class EventPlace {
    constructor(classroom, placeName) {
        if (placeName === undefined || placeName == null) {
            this.type = "INT"
            this.place = classroom;
        } else if (classroom === undefined || classroom == null) {
            this.type = "EXT"
            this.place = placeName;
        }
    }

    isInternal() {
        return (this.type == 'INT');
    }

    getPlaceName() {
        if (this.type == 'INT') {
            return this.place.name;
        } else if (this.type == 'EXT') {
            return this.place.placeName;
        }
    }

    getClassroomId() {
        if (this.type == 'INT') {
            return this.place.id;
        } else if (this.type == 'EXT') {
            console.log('The place is not internal.');        
        }
    }
}

class Teacher {
    constructor(teacher_id, teacher_name) {
        this.id = teacher_id;
        this.name = teacher_name;
    }
}

class Classroom {
    constructor(classroomId, classroomName) {
        this.id = classroomId;
        this.name = classroomName;
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

    $('#quick_delet_event_btn').on('click', () => {
        firebase.database().ref('event/'+ selectedEvent).once('value', snap => {
            var classroom_key = snap.val().classroom_key;
            EventsManagement.deleteEvent(selectedEvent, classroom_key);
        })
    });
    
    /************************ new event ************************/

    /*New event date*/
    $('#new_event_date_btn').on('click', () => {
        EventsManagement.eventDateInit();
        showPage($('#new_event_date_page'));
    });

    $('#create_event_date_btn').on('click', () => {
        var eventDate = $('#datetimepicker3').datetimepicker('getValue');
        var dateString = eventDate.getFullYear() + '-' + (eventDate.getMonth()+1) + '-' + eventDate.getDate();
        var eventDate = new EventDate(dateString);
        
        if (EventsManagement.classroomName == 'Inserisci nuovo luogo') {
            var eventPlace = new EventPlace(null, $('#event_place').val());
        } else {
            var eventPlace = new EventPlace(new Classroom(EventsManagement.classroomId, EventsManagement.classroomName), null);
        }

        eventDate.setClasses(EventsManagement.selectedClasses);
        eventDate.setHours(EventsManagement.selectedHours);
        eventDate.setPlace(eventPlace);
        EventsManagement.newEvent.addDate(eventDate);
        EventsManagement.eventDateResetForms();
        backPage();
    });
    
    jQuery('#datetimepicker3').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#select_event_classroom, #datetimepicker3').on('change', () => {
        EventsManagement.updateEventPageData();
    });

    $('#select_event_classroom').on('change', () => {
        $("#schedule_event_table").show();
        if (EventsManagement.classroomName == "Inserisci nuovo luogo") {
            $("#event_place").show();
        } else {
            $("#event_place").hide();
        }
    });
    
    $('#new_event_btn').on('click', () => {
        showPage($('#new_event_page'));
    });
    
    $('#schedule_event_table').on('click', '.clickable-row', function(event) {
        var idx;
        if ($(this).hasClass('selected_row')) {
            $(this).removeClass('selected_row');
            idx = EventsManagement.selectedHours.indexOf($(this).attr('value'));
            if (idx >= 0) EventsManagement.selectedHours.splice(idx, 1);
            nSelectedRows--;
        } else if (!$(this).hasClass('selected_row') && !$(this).hasClass('mybook') && !$(this).hasClass('event_prenotation')) {
            $(this).addClass('selected_row');
            EventsManagement.selectedHours.push($(this).attr('value'));
            EventsManagement.nSelectedRows++;
        }
    });
    
    //save the event on database
    $('#create_event_btn').on('click', () => {
        EventsManagement.createEvent();
        EventsManagement.resetForms();
    });

    $('#modal_link_event_desk').on('click', () => {
        $('#exampleModalLong').modal();
    });
});

function onClickHandler(cb) {
    var instituteClass = new InstituteClass($(cb).val().split(',')[0], $(cb).val().split(',')[1]);
    if (cb.checked) {
        if (!EventsManagement.selectedClasses.includes(instituteClass)) {
            EventsManagement.selectedClasses.push(instituteClass);
        }
    } else {
        if (EventsManagement.selectedClasses.includes(instituteClass)) {
            var index = EventsManagement.selectedClasses.indexOf(instituteClass);
            if (index > -1) {
                EventsManagement.selectedClasses.splice(index, 1);
            }
        }
    }
}