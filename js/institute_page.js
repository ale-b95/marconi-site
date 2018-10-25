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

    bachecaAutoScroll : function () {
        var date = new Date();
        $('#bacheca_date').text( date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear());
        var morning_hours = ['bt_hid_8', 'bt_hid_9','bt_hid_10','bt_hid_11','bt_hid_12','bt_hid_13','bt_hid_14'];
        var afternoon_hours = ['bt_hid_15','bt_hid_16','bt_hid_17','bt_hid_18','bt_hid_19','bt_hid_20','bt_hid_21'];
        var night_hours = ['bt_hid_22','bt_hid_23','bt_hid_24'];
        //prepare elements to show first
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
        //start cycling the elements
        INTERVAL = setInterval(function () {
            date = new Date();
            $('#bacheca_date').text( date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear());
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
    },

    clearBacheca : function () {
        for (i = 1; i <= 10; i++) {
            $('#th_'+ i).empty();
        }

        for (i = 8; i < 25; i++) {
            for (j = 0; j < 10 ; j++) {
                $('#cll_'+ i + '_' + j).empty();
                $('#cll_'+ i + '_' + j).removeClass('reserved_lesson');
                $('#cll_'+ i + '_' + j).removeClass('reserved_event');   
            }
        }
    },

    loadBacheca : function () {
        this.bachecaAutoScroll();
        this.clearBacheca();
        var date = new Date();
        firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').on('value', () => {
            this.clearBacheca();
            var selected_croom = [];
            var croom_w_prenotation = [];
            var bacheca_croom = [];

            var promises = [];

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

            promises.push(myProm_01);
            promises.push(myProm_02);

            Promise.all(promises).then(() => {
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

                    $("#th_"+idx).text(childSnap.val().classroom);
                    $("#bt_hid_"+hour+" td:nth-child("+index+")").text(text);
                    if (event_title) {
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_event'); 
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").removeClass('reserved_lesson');          
                    } else {
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_lesson');
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").removeClass('reserved_event'); 
                    }
                });
            });
        } else {
            firebase.database().ref('classroom/'+classroom_name).once('value', snap => {
                $("#th_"+idx).text(snap.val().classroom_name);
            });
        }
    },

    loadShowcase : function () {
        var now = new Date();
        var first_hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        var last_hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        firebase.database().ref('announcement/').on('value', snap => {
            $('.announcement-show').remove();
            snap.forEach(childSnap => {
                if (childSnap.val().startDate <= last_hour.getTime() && childSnap.val().startDate >= first_hour.getTime()) {
                    $('#showcase').append('<div class="jumbotron announcement-show">'+
                        '<h1 class="h3 mb-3 font-weight-normal">Avviso: '+ childSnap.val().title +'</h1>'+
                        '<p>'+ childSnap.val().description + '</p></div>');
                }
            });
        });

        firebase.database().ref('event/').orderByChild("date").startAt(first_hour.getTime()).endAt(last_hour.getTime()).on("value", snap => {
            $('.event-show').remove();
            snap.forEach(childSnap => {
                $('#showcase').append('<div class="jumbotron event-show">'+
                    '<h1 class="h3 mb-3 font-weight-normal">Evento: '+ childSnap.val().title +'</h1>'+
                    '<p>'+ childSnap.val().description + '</p></div>');
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

    $("#prenotation_back_btn").on('click', () => {
        console.log('hello');
        $("#class_pren_table").slideUp();
        $('#prenotations_list').empty();
        $('#datetimepicker2').datetimepicker('reset');
    });

    $("#select_class_pren, datetimepicker2").on('change', () => {
        $("#class_pren_table").slideDown();
    })
    
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
        DataFormFillUtility.loadShowcase();
        showPage($("#big_table_page"));
        
    });

    $('#bacheca_back_btn').on('click', () => {
        clearInterval(INTERVAL);
    });
});