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
    
        this.newEvent = new InstituteEvent();

        this.selectedEvent = null;

        this.dbEvents = [];

        this.addDate = false;
    },

    eventDateInit : function () {
        EventsManagement.selectedClasses = [];
        EventsManagement.selectedHours = [];
        EventsManagement.nSelectedRows = 0;
        EventsManagement.newEventClassSelection.loadClasses(null, null);
    },

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

        var dbEvents = [];
        var events_ref = [];

        // 1) get reference of the events with dates on the selected period
        firebase.database().ref('event/').once('value', snap => {
            snap.forEach(eventsSnap => {
                eventId = eventsSnap.key;
                if (eventsSnap.child('day').exists()) {
                    eventsSnap.child('day').forEach(d => {
                        var ddate = new Date(d.val());
                        if (ddate > startdate && ddate < enddate) {
                            if (!events_ref.includes(eventId)){
                                events_ref.push(eventId);
                            }
                        }
                    });
                } else if (!eventsSnap.child('day').exists() && Marconi.admin == 1) {
                    if (!events_ref.includes(eventId)){
                        events_ref.push(eventId);
                    }
                }
            });
        }).then(() => {
        //2) for each event selected from the database create an object representation
            var promises = [];
            events_ref.forEach(ref => {
                var prom = firebase.database().ref('event/'+ref).once('value', snap => {
                    var tmpEvent = new InstituteEvent();
                    tmpEvent.setId(ref);
                    tmpEvent.setTitle(snap.val().title);
                    tmpEvent.setDescription(snap.val().description);
                    tmpEvent.setOnShowcase(snap.val().onShowcase);
                    tmpEvent.setOrganizer(new Teacher(snap.child('organizer').val().id, snap.child('organizer').val().name));

                    snap.child('date').forEach(dateSnap => {
                        var tmpDate = new EventDate(dateSnap.key);
                        dateSnap.child('hour').forEach(hourSnap => {
                            tmpDate.hours.push(hourSnap.val());
                        });

                        var placeId = null;
                        var placeName = null;
                        var isInternal = null;

                        dateSnap.child('place').forEach(placeSnap => {
                            if (placeSnap.key == 'internal') {
                                isInternal = placeSnap.val();
                            } else if (placeSnap.key == 'id') {
                                placeId = placeSnap.val();
                            } else if (placeSnap.key == 'name') {
                                placeName = placeSnap.val();
                            }
                        }); 

                        if (isInternal) {
                            tmpDate.setPlace(new EventPlace(new Classroom(placeId, placeName)));
                        } else {
                            tmpDate.setPlace(new EventPlace(undefined, placeName));
                        }
                        tmpEvent.date.push(tmpDate);
                 
                    }); 

                    dbEvents.push(tmpEvent);
                });

                promises.push(prom);
            });

            //3) for each event add a list element with a link to the page to see the events dettails and the delete button
            Promise.all(promises).then(() => {
                dbEvents.forEach(e => {
                    //3.1 create the list element with the delete button
                    if (Marconi.admin == '1' || e.getOrganizer().id == user.uid) {
                        $('#event_list').append('<div class="list-group-item event_list">'
                        +'<div id="ed_'+ e.id +'">'
                        + e.title +'</div><button id="del_btn_'+ e.id +'" value="'+ e.id +'" type="button" class="btn btn-primary">Elimina</button></div>');
                    }   

                    //3.2 add a listener for the delete button of each list element
                    $("#del_btn_"+ e.id).click(() => {
                        EventsManagement.selectedEvent = e;
                        $('#deleteEventModal').modal();
                    });

                    //3.3 add a listener for each list element to show a page in witch the relative event details are shown
                    $("#ed_"+e.id+"").click(() => {
                        //3.3.1 set the global event identifier with the selected event reference
                        EventsManagement.selectedEvent = e;

                        //3.3.2 remove the previous event handler from the buttons
                        $("#delete_event").off();
                        $("#save_event").off();
                        
                        $("#ed_title").text('Titolo: '+e.title);
                        $("#ed_description").text('Descrizione: '+e.description);
                        $("#ed_organizer").text('Organizzatore: '+e.organizer.name);
                        $('#check_event_det').prop("checked", e.onShowcase);

                        $('#event_date_details_list').empty();

                        EventsManagement.loadEventDateList(EventsManagement.selectedEvent, 'event_date_details_list');

                        $('#check_event_det').on('change', () => {
                            firebase.database().ref('event/'+EventsManagement.selectedEvent.id).update({
                                onShowcase : $('#check_event_det').is(':checked')
                            });
                        });

                        if (Marconi.admin == 1 || Marconi.user.uid == teacher_key) {
                            $("#safe_delete_event_btn").show();
                            $("#save_event").hide();
                            $("#delete_event").on('click', () => {
                                EventsManagement.deleteEvent(EventsManagement.selectedEvent);
                                EventsManagement.loadEventList();
                                $("#safe_delete_event_btn").text('Elimina evento');
                                $("#delete_event").slideUp();
                            });
                        }

                        showPage($('#event_details_page'));
                    });
                });
            });
        });
    },

    loadEventDateList : function (event, listId) {
        $('#'+listId).empty();
        event.date.forEach(d => {
            var dateName = d.date+ ' ' + d.place.getPlaceName();
            $('#'+listId).append('<div class="list-group-item event_list"><div id="'
            + d.id +'">'+ dateName +'</div><button id="date_'
            + d.id +'" type="button" class="btn btn-primary">Elimina</button></div>');

            $('#'+d.id).on('click', () => {
                EventsManagement.loadEventDatePage(d, event, listId);
            });

            $('#date_'+ d.id).on('click', () => {
                event.getDate().forEach(selectedDate => {
                    if (d.id == selectedDate.id) {
                        var index = event.getDate().indexOf(selectedDate);
                        if (index > -1) {
                            event.getDate().splice(index, 1);
                        }
                        EventsManagement.deleteEventDate(event, selectedDate);
                    }
                });
                EventsManagement.loadEventDateList(event, listId);
            });
        });
    },

    loadEventDatePage : function (date, event, listId) {
        var str = '<table><tdody><tr><th>Giorno</th><td>'+date.date+'</td></tr><tr><th>Luogo</th><td>'+date.place.getPlaceName()+'</td></tr><tr><th>Orario</th><td><ul>';
        date.hours.forEach(h => {
            str += '<li>'+SPECIAL_HOURS[h] +'</li>';
        });
        str +='</ul></td></tr><tr><th>Classi presenti</th><td><ul>';
        date.classes.forEach(c => {
            str +='<li>'+c.name+'</li>';
        });
        str +='</ul></td></tr></tdody></table>';
        $('#event_date_details').empty();
        $('#event_date_details').append(str);

        showPage($('#event_date_detail_page'));

        $('#delete_current_event_date').on('click', () => {
            var index = event.date.indexOf(date);
            if (index > -1) {
                event.date.splice(index, 1);
            }
            EventsManagement.deleteEventDate(event, date);
            EventsManagement.loadEventDateList(event, listId);
        });
    },

    changeEventDetails : function (eventId, newTitle, newDesc) {
        if (newTitle != '' && newDesc != '') {
            firebase.database().ref('event/'+eventId).update({
                title : newTitle,
                description : newDesc
            });
            $("#ed_title").text('Titolo: ' + $('#event_title_text').val());
        } else {
            alert('Modifica non registrata. I campi Titolo e Descrizione non possono essere vuoti.');
        }
    },

    deleteEvent : function (event) {
        var promises = []
        event.date.forEach(date => {
            promises.push(EventsManagement.deleteEventDate(event, date));
        });

        Promise.all(promises).then(() => {
            firebase.database().ref('event/'+event.id).remove();
        });
    },

    deleteEventDate : function (event, date) {
        var classes = [];
        var hours = [];
        var classroom = '';
        
        var prom = firebase.database().ref('event/'+event.id+'/date/'+date.date).once('value', dateStr => {
            // 1) find the classes and remove the references and prenotations
            dateStr.child('class').forEach(instClass => {
                classes.push(instClass.key);
                firebase.database().ref('class/'+instClass.key+'/event/'+event.id+'/date/'+date.date).remove();
                firebase.database().ref('class/'+instClass.key+'/prenotation/'+date.date).once('value', dateDate => {
                    dateDate.forEach(hour => {
                        if (hour.val() == 'event,'+event.id) {
                            firebase.database().ref('class/'+instClass.key+'/prenotation/'+date.date+'/'+hour.key).remove();
                        }
                    });
                })
            });
            // 2) find the prenoted hours
            dateStr.child('hour').forEach(prenotHour => {
                hours.push(prenotHour.val());
            });

            // 3) find the prenoted classroom
            if (dateStr.child('place').val().internal) {
                classroom = dateStr.child('place').val().id;
            }

        }).then(() => {
            // 4) delete the whole event reference if there are no dates
            classes.forEach(c => {
                firebase.database().ref('class/'+c+'/event/'+event.id).once('value', e => {
                    if (!e.child('date').exists() && e.exists()) {
                        firebase.database().ref('class/'+c+'/event/'+event.id).remove();
                    }
                });
            });
            // 5) delete the prenotation references
            hours.forEach(h => {
                firebase.database().ref(
                'prenotation/'+date.date.split('-')[0]
                +'/'+date.date.split('-')[1]
                +'/'+date.date.split('-')[2]
                +'/'+classroom
                +'/'+h).remove();
            });
        }).then(() => {
            firebase.database().ref('event/'+event.id+'/date/'+date.date).remove();
            firebase.database().ref('event/'+event.id+'/day').once('value', day => {
                day.forEach(d => {
                    if (d.val() == date.date) {
                        firebase.database().ref('event/'+event.id+'/day/'+d.key).remove();
                    }
                });
            });
        });

        return prom;
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
        this.selectedEvent = this.newEvent;
        this.newEvent.setTitle($('#event_title')[0].value);
        this.newEvent.setDescription($('#event_description')[0].value);
        this.newEvent.setOnShowcase($('#check_event_creation').is(":checked"));
        this.newEvent.setOrganizer(new Teacher(this.user.uid, this.user.displayName));
        var dates = [];

        this.newEvent.date.forEach(d => {
            if (!dates.includes(d.date)){
              dates.push(d.date);
            }
        });

        if (this.newEvent.getTitle() == '' || this.newEvent.getTitle() == null) {
            alert('Inserire Titolo');
        } else if (this.newEvent.getDescription() == '' || this.newEvent.getDescription() == null) {
            alert('Inserire Descrizione');
        } else {
            firebase.database().ref('event').push(this.newEvent.getJsonObj()).then((snap) => {
                EventsManagement.newEvent.id = snap.key;
                this.newEvent.getDate().forEach(eventDate => {
                    EventsManagement.addDateToDbEvent(EventsManagement.newEvent, eventDate);
                });
                
                EventsManagement.newEvent.date = [];
                EventsManagement.loadEventDateList(this.newEvent, 'event_date_list');
                EventsManagement.loadEventList();
                backPage();
            });
        }
    },

    createEventDate : function () {
        var check = true;
        var eventDate = $('#datetimepicker3').datetimepicker('getValue');
        if (eventDate == null) eventDate = new Date();
        var dateString = eventDate.getFullYear() + '-' + (eventDate.getMonth()+1) + '-' + eventDate.getDate();
        var eventDate = new EventDate(dateString);

        EventsManagement.selectedEvent.date.forEach(d => {
            if (d.date == dateString) {
                alert('E\' già presente un\'altra data per il giorno selezionato');
                check = false;
            }
        });

        if (check) {
            if (EventsManagement.classroomName == 'Seleziona un\'aula' || ($('#event_place').val() == '' && EventsManagement.classroomName == 'Inserisci nuovo luogo')){
                alert('Seleziona un luogo per l\'evento');
                check = false;
            }
        }

        if (check) {
            if (EventsManagement.selectedHours.length == 0) {
                alert('Seleziona un orario per l\'evento');
                check = false;
            }
        }

        if (check) {
            if ($('#event_place').val() != '' && EventsManagement.classroomName == 'Inserisci nuovo luogo') {
                var eventPlace = new EventPlace(null, $('#event_place').val());
            } else {
                var eventPlace = new EventPlace(new Classroom(EventsManagement.classroomId, EventsManagement.classroomName), null);
            }
            eventDate.setClasses(EventsManagement.selectedClasses);
            eventDate.setHours(EventsManagement.selectedHours);
            eventDate.setPlace(eventPlace);
            EventsManagement.eventDateResetForms();
            backPage();
            return eventDate;
        } else {
            return null;
        }
    },

    addDateToDbEvent : function (event, eventDate) {
        var jobj = '{';
        if (eventDate.classes.length > 0) {
            jobj += '"class" : {';
            eventDate.classes.forEach(eventClass => {
                jobj += '"'+eventClass.id+'" : "'+ eventClass.name+'",';
            });
            jobj = jobj.substring(0, jobj.length - 1);
            jobj += '},';
        }
        jobj += '"place" : { "internal" : '+ eventDate.place.isInternal()+', ';
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
        jobj += ']}';
        console.log(jobj);
        jobj = JSON.parse(jobj);
        firebase.database().ref('event/'+event.id+'/date/'+eventDate.date+'/').update(jobj);
        firebase.database().ref('event/'+event.id+'/day').push(eventDate.date);
        if (eventDate.place.isInternal()) {
            Marconi.eventHourPrenotation(eventDate.date, eventDate.place, eventDate.hours, event.title, event.id);
        }
        Marconi.classEventPrenotation(event.id, event.title, eventDate);
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
        EventsManagement.deleteEvent(EventsManagement.selectedEvent);
    });

    $('#mod_event_desk').on('click', () => {
        EventsManagement.changeEventDetails(EventsManagement.selectedEvent.id, $('#event_title_text').val(), $('#event_desc_txt_area').val());
    });
    
    /************************ new event ************************/

    /*New event date*/
    $('#new_event_date_btn').on('click', () => {
        EventsManagement.selectedEvent = EventsManagement.newEvent;
        EventsManagement.eventDateInit();
        showPage($('#new_event_date_page'));
    });

    $('#add_event_date_btn').on('click', () => {
        EventsManagement.addDate = true;
        EventsManagement.eventDateInit();
        showPage($('#new_event_date_page'));
    });

    $('#create_event_date_btn').on('click', () => {
        var newDate = EventsManagement.createEventDate();
        if (newDate != null) { 
            if (EventsManagement.addDate) {
                EventsManagement.addDateToDbEvent(EventsManagement.selectedEvent, newDate);
                EventsManagement.addDate = false;
            }
            EventsManagement.selectedEvent.addDate(newDate);
            EventsManagement.loadEventDateList(EventsManagement.selectedEvent);
        }
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
        EventsManagement.newEvent = new InstituteEvent();
        $('.date_list').empty();
        showPage($('#new_event_page'));
    });
    
    $('#schedule_event_table').on('click', '.clickable-row', function(event) {
        var idx;
        if ($(this).hasClass('selected_row')) {
            $(this).removeClass('selected_row');
            idx = EventsManagement.selectedHours.indexOf($(this).attr('value'));
            if (idx >= 0) EventsManagement.selectedHours.splice(idx, 1);
            EventsManagement.nSelectedRows--;
        } else if (!$(this).hasClass('selected_row') && !$(this).hasClass('mybook') && !$(this).hasClass('event_prenotation')) {
            $(this).addClass('selected_row');
            EventsManagement.selectedHours.push($(this).attr('value'));
            EventsManagement.nSelectedRows++;
        }
    });
    
    //save the event on database
    $('#create_event_btn').on('click', () => {
        if (EventsManagement.newEvent.date.length == 0) {
            alert('L\'evento non ha date. Crea almeno una data per l\'evento');
        } else {
            EventsManagement.createEvent();
            EventsManagement.resetForms();
        }
    });

    $('#modal_link_event_desk').on('click', () => {
        $('#desc_title').empty();
        $('#desc_text').empty();
        $('#desc_title').append('<div class="form-group"><input type="text" class="form-control" id="event_title_text" value="'+EventsManagement.selectedEvent.title+'"></div>');
        $('#desc_text').append('<div class="form-group"><textarea class="form-control" rows="5" id="event_desc_txt_area">'+EventsManagement.selectedEvent.description+'</textarea></div>');
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