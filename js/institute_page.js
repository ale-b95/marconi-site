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
        $('#'+select_classroom).append('<option value="" selected>Seleziona aula</option>');
        if (defaultmsg != null) {
             $('#'+select_classroom).append('<option value="" selected>'+ defaultmsg +'</option>');
        }
        
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

        $('#'+select_class).append('<option value="" selected>'+ defaultmsg +'</option>');

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
        var croom_keys = [];
        firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').once('value', snap => {
            snap.forEach(childSnap => {
                if (!croom_keys.includes(childSnap.key)) {
                    croom_keys.push(childSnap.key);
                }
            });
        }).then(() => {
            var n_croom = croom_keys.length;

            $("#big-table").append('<thead id="big-table-head"></thead>');
            $("#big-table-head").append("<th id='th-0'></th>");
            croom_keys.forEach((value, i) => {
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
        

            croom_keys.forEach((value, i) => {
                //for each selected classroom prints on the big table the corresponding schedule
                var pRef = firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/'+value+'/');
                pRef.once('value', snap => {
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
            });

            if (n_croom == 0) {
                $("#big-table").empty();
                $("#no_prenotations").show();
            }
        });     
    },

    loadUserSelectList : function (select_user, defaultmsg) {
        $('#'+select_user).empty();
        if (defaultmsg == null) {
            defaultmsg = "Seleziona utente";
        }
        $('#'+select_user).append('<option value="" selected>'+ defaultmsg +'</option>');

        /*
            get the reference to the database to obtain the list of classes
            and generate the html code for each class found on the database
        */
        firebase.database().ref('user/').once('value', snap => {
            snap.forEach(childSnap => {
                $('#'+select_user).append('<option value="usr_'+childSnap.key+'">'+childSnap.val().name + ' ' + childSnap.val().surname+'</option>');
            });
        });
    },

    loadDayScheduleTable : function ( table_body, table_click_ref, day) {
        $("#"+table_body).empty();
        
        for (var hour = 8; hour<25; hour++) {
            $("#"+table_body).append(
            '<tr class="clickable-row" id="'+table_body+'_'+hour+'" value="'+hour+'">'+
            '<th>'+hour+':00</th><td></td>'+
            '</tr>');
        }

        $("#"+table_body).on('click', '.clickable-row', function(event) {
            var idx;
            if ($(this).hasClass('selected_row')) {
                $(this).removeClass('selected_row');
                table_click_ref.selected_rows--;
                idx = table_click_ref.selected_hours[day].indexOf($(this).attr('value'));
                if (idx >= 0) table_click_ref.selected_hours[day].splice(idx, 1);
                table_click_ref.cs_selected_rows--;
            } else if (!$(this).hasClass('selected_row') && !$(this).hasClass('mybook') && !$(this).hasClass('event_prenotation')) {
                $(this).addClass('selected_row');
                table_click_ref.selected_hours[day].push($(this).attr('value'));
                table_click_ref.selected_rows++;
            }
        });
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