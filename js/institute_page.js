var DataFormFillUtility = {
    
    /*
        fill the specified select list with the classrooms loaded from the database
        is possible to personalize the first option field adding a default message
    */
    loadClassroomSelectList : function (select_classroom, defaultmsg, selectable) {
        $('#'+select_classroom).empty();
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        if (defaultmsg == null) {
            defaultmsg = "Seleziona un'aula";
        }

        if (selectable) {
            $('#'+select_classroom).append('<option value="" selected>'+ defaultmsg +'</option>');
        } else {
            $('#'+select_classroom).append('<option value="" disabled selected>'+ defaultmsg +'</option>');
        }
        
        /*
            get the reference to the database to obtain the list of the classrooms
        */
        firebase.database().ref('classroom/').orderByChild('classroom_name').once('value', snap => {
            /*
                generate the html code for each classroom found on the database
            */
            snap.forEach(childSnap => {
                var name = childSnap.child('/classroom_name').val();
                var key = childSnap.key;
                $('#'+select_classroom).append('<option value="'+key+'">'+name+ '</option>');
            });
        });
    },

    /*
        fill the specified select list with the classes loaded from the database
        is possible to personalize the first option field adding a default message
    */
    loadClassSelectList : function (select_class, defaultmsg) {
        $('#'+select_class).empty();
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        if (defaultmsg == null) {
            defaultmsg = "Seleziona classe";
        }
        $('#'+select_class).append('<option value="" disabled selected>'+ defaultmsg +'</option>');

        /*
            get the reference to the database to obtain the list of classes
            and generate the html code for each class found on the database
        */
        firebase.database().ref('class/').orderByKey().once('value', snap => {
            snap.forEach(childSnap => {
                $('#'+select_class).append('<option>'+childSnap.key+'</option>');
            });
        });
    },

    loadBacheca : function () {
        
        var date = new Date();
        var myInterval = 0;

        firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').on('value', () => { 
            if (myInterval != 0) clearInterval(myInterval);
            $("#big-table").empty();
            $("#big-table-head").empty();
            $("#big-table-body").empty();
            
            var selected_croom = [];
            var croom_w_prenotation = [];
            var bacheca_croom = [];

            var promises1 = [];

            var myProm_01 = firebase.database().ref('classroom/').once('value', snap => {
                snap.forEach(childSnap => {
                    if (childSnap.val().isFavourite) {
                        if (!selected_croom.includes(childSnap.key)) {
                            selected_croom.push(childSnap.key);
                        }
                    }
                });
            });

            var myProm_02 = firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').once('value', snap => {
                snap.forEach(childSnap => {
                    if (!croom_w_prenotation.includes(childSnap.key)) {
                        croom_w_prenotation.push(childSnap.key);
                    }
                });
            });

            promises1.push(myProm_01);
            promises1.push(myProm_02);

            Promise.all(promises1).then(() => {
                var n_croom = 10;

                //first add classrooms selected which have prenotations
            for (i in selected_croom) {
                    if (croom_w_prenotation.includes(selected_croom[i])) {
                        bacheca_croom.push(selected_croom[i]);
                    }
                }

                //then add other classrooms with prenotations
                for (i in croom_w_prenotation) {
                    if (!bacheca_croom.includes(croom_w_prenotation[i])) {
                        bacheca_croom.push(croom_w_prenotation[i]);
                    }
                }

                //then add all remaining selected classrooms
                for (i in selected_croom) {
                    if (!bacheca_croom.includes(selected_croom[i])) {
                        bacheca_croom.push(selected_croom[i]);
                    }
                }

                $("#big-table").append('<thead id="big-table-head"></thead>');
                $("#big-table-head").append("<th id='th-0'></th>");

                for (i = 0; i < 10; i++) {
                    var idx = i + 1;
                    $("#big-table-head").append("<th id='th-"+idx+"'></th>");
                }

                $("#big-table").append('<tbody id="big-table-body"></tbody>');

                for (var hour = 8; hour<25; hour++) {
                    $("#big-table-body").append(
                    '<tr id="bt_hid_'+hour+'" value="'+hour+'">'+
                    '</tr>');
                    $("#bt_hid_"+hour).append('<th>'+hour+':00</th>');
                    for(var i = 0; i < n_croom; i++) {
                        $("#bt_hid_"+hour).append('<td id=cll-"'+hour+'-'+i+'"> </td>');
                    }
                }

                var morning_hours = ['bt_hid_8', 'bt_hid_9','bt_hid_10','bt_hid_11','bt_hid_12','bt_hid_13',];
                var afternoon_hours = ['bt_hid_14','bt_hid_15','bt_hid_16','bt_hid_17','bt_hid_18','bt_hid_19',];
                var night_hours = ['bt_hid_20','bt_hid_21','bt_hid_22','bt_hid_23','bt_hid_24',];
                
                for (id in afternoon_hours) {
                    $('#'+afternoon_hours[id]).fadeOut();
                    $('#'+night_hours[id]).fadeOut();
                }
                setTimeout(() => {
                    for (id in morning_hours) {
                        $('#'+morning_hours[id]).fadeIn();
                    }
                }, 500);

                var state = 0;
                myInterval = setInterval(function () {
                    switch (state) {
                        case 0:
                            for (id in afternoon_hours) {
                                $('#'+afternoon_hours[id]).fadeOut();
                                $('#'+night_hours[id]).fadeOut();
                            }
                            setTimeout(() => {
                                for (id in morning_hours) {
                                    $('#'+morning_hours[id]).fadeIn();
                                }
                            }, 500);
                        break;
                        case 1:
                            for (id in morning_hours) {
                                $('#'+morning_hours[id]).fadeOut();
                                $('#'+night_hours[id]).fadeOut();
                            }
                            setTimeout(() => {
                                for (id in afternoon_hours) {
                                    $('#'+afternoon_hours[id]).fadeIn();
                                }
                            }, 500);
                        break;
                        case 2:
                            for (id in morning_hours) {
                                $('#'+morning_hours[id]).fadeOut();
                                $('#'+afternoon_hours[id]).fadeOut();
                            }
                            setTimeout(() => {
                                for (id in night_hours) {
                                    $('#'+night_hours[id]).fadeIn();
                                }
                            }, 500);
                        break;
                        default:
                    }
                    state = (state + 1) % 3;
                }, 10000);

                for (i in bacheca_croom) {
                    var idx = parseInt(i) + 1;
                    this.fillBacheca(croom_w_prenotation ,bacheca_croom[i], idx);
                }
            });
        });
    },

    fillBacheca : function (classrooms_with_prenotation, classroom_name, idx) {
        if (classrooms_with_prenotation.includes(classroom_name)) {
            var date = new Date();
            //for each selected classroom prints on the big table the corresponding schedule
            firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/'+classroom_name+'/').once('value', snap => {
                snap.forEach(childSnap => {
                    var index = idx + 1;
                    var hour = childSnap.key;
                    var event_title = childSnap.val().event;
                    var text;

                    if (event_title) {
                        text = event_title;
                    } else {
                        text = childSnap.val().class + ' ' + childSnap.val().teacher;
                    }

                    $("#th-"+idx).text(childSnap.val().classroom);
                    $("#bt_hid_"+hour+" td:nth-child("+index+")").text(text);
                    if (event_title) {
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_event'); 
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").remove('reserved_lesson');          
                    } else {
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_lesson');
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").removeClass('reserved_event'); 
                    }
                });
            });
        } else {
            firebase.database().ref('classroom/'+classroom_name).once('value', snap => {
                $("#th-"+idx).text(snap.val().classroom_name);
            });
        }
    },

    eventDisplay : function () {
        var now = new Date();
        var first_hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        var last_hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        var title;
        var description;
        firebase.database().ref('event/').orderByChild("date").startAt(first_hour.getTime()).endAt(last_hour.getTime()).on("value", snap => {
            $('#showcase').empty();
            snap.forEach(childSnap => {
                special = childSnap.val().special;
                title = childSnap.val().title;
                description = childSnap.val().description;
                if (special) {
                    $('#showcase').append('<div class="jumbotron event-show">'+
                '<h1>'+ title +'</h1>'+
                '<p>'+ description + '</p></div>');
                }
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
                '<tr class="clickable-row d-'+day+' collapse d-row" id="'+table_body+'_'+hour+'_'+day+'" value="'+hour+'">'+
                '<th>'+hour+':00</th>'+
                '</tr>');
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
    
    $("#events_btn").on('click', () => {
        $("#schedule_event_table_body").empty();
        DataFormFillUtility.loadClassroomSelectList("select_event_classroom", "Esterno", true);
        DataFormFillUtility.loadClassSelectList("event_class");
        EventsManagement.loadEventList();
        showPage($("#events_page"));
    });
    
    $("#search_class_btn").on('click', () => {
        DataFormFillUtility.loadClassSelectList("select_class_pren");
        showPage($("#prenotations_page"));
    });

    $("#bacheca_btn").on('click', () => {
        DataFormFillUtility.loadBacheca();
        DataFormFillUtility.eventDisplay();
        showPage($("#big_table_page"));
        
    });
});