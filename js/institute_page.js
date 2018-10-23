var DataFormFillUtility = {
    
    /*
        fill the specified select list with the classrooms loaded from the database
        is possible to personalize the first option field adding a default message
    */
    loadClassroomSelectList : function (select_classroom, defaultmsg) {
        $('#'+select_classroom).empty();
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        if (defaultmsg == null) {
            defaultmsg = "Seleziona un'aula";
        }

        $('#'+select_classroom).append('<option value="" disabled selected>'+ defaultmsg +'</option>');
        
        /*
            get the reference to the database to obtain the list of the classrooms
        */
        const dbRef = firebase.database().ref('classroom/');
        dbRef.once('value', snap => {
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
        firebase.database().ref('class/').once('value', snap => {
            snap.forEach(childSnap => {
                $('#'+select_class).append('<option>'+childSnap.key+'</option>');
            });
        });
    },

    loadBacheca : function () {
        $("#big-table").empty();
        var date = new Date();
        var selected_croom = [];
        var croom_w_prenotation = [];
        var bacheca_croom = [];
        var processed = [];

        var promises1 = [];
        var promises2 = [];

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
            console.log('selected:\n' + selected_croom);
            console.log('w prenot:\n' + croom_w_prenotation);

            for (i in selected_croom) {
                if (croom_w_prenotation.includes(selected_croom[i])) {
                    bacheca_croom.push(selected_croom[i]);
                    croom_w_prenotation = jQuery.grep(croom_w_prenotation, value => {
                        return value != selected_croom[i];
                    });

                    selected_croom = jQuery.grep(selected_croom, value => {
                        return value != selected_croom[i];
                    });
                }
            }

            for (i in croom_w_prenotation) {
                if (bacheca_croom.length < 10) bacheca_croom.push(croom_w_prenotation[i]);
            }

            for (i in selected_croom) {
                if (bacheca_croom.length < 10) bacheca_croom.push(selected_croom[i]);
            }

            console.log(bacheca_croom);
            var n_croom = 10;

            $("#big-table").append('<thead id="big-table-head"></thead>');
            $("#big-table-head").append("<th id='th-0'></th>");
            bacheca_croom.forEach((value, i) => {
                $("#big-table-head").append("<th id='th-"+(i+1)+"'></th>");
            });

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

            bacheca_croom.forEach((value, i) => {
                processed.push(value);
                //for each selected classroom prints on the big table the corresponding schedule
                var myProm_03 = firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/'+value+'/').once('value', snap => {
                    snap.forEach(childSnap => {
                        var index = i + 2;
                        var hour = childSnap.key;
                        var teacher_name = childSnap.val().teacher;
                        var class_name =  childSnap.val().class;
                        var event_title = childSnap.val().event;
                        var classroom_name = childSnap.val().classroom;
                        var text;

                        if (event_title) {
                            text = event_title;
                        } else {
                            text = class_name + ' ' + teacher_name;
                        }
                        $("#th-"+(i+1)).text(classroom_name);
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").text(text);
                        if (event_title) {
                            $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_event');           
                        } else {
                            $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_lesson');
                        }
                    });
                });

                promises2.push(myProm_03)
            });

            //todo stampare anche quelli che non hanno prenotazioni
            Promise.all(promises2).then(() => {
                for (i in processed) {
                    bacheca_croom = jQuery.grep(bacheca_croom, value => {
                        return value != bacheca_croom[i];
                    });
                }

                for  (i = 1; i < bacheca_croom.length; i++) {
                    firebase.database().ref('classroom/'+bacheca_croom[i]+'/').once('value', snap => {
                        var name = snap.val().classroom_name;
                        $("#th-"+(i+1)).text(name);
                    });
                }
            });

            

            var selectors = [
                ":lt(8)",
                ":gt(7)"
            ];
            var $tableslide = $("#big-table-body").children(selectors[1]).hide().end();
            var state = false;
            setInterval(function () {
                var s = state;
                $tableslide.children(selectors[+s]).fadeOut().promise().then(function () {
                    $tableslide.children(selectors[+!s]).fadeIn();
                });
                state = !state;
            }, 10000);
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
        DataFormFillUtility.loadClassroomSelectList("select_event_classroom", "Esterno");
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
        showPage($("#big_table_page"));
    });
});