$(function () {
    /*
        Handle the buttons on institute page and show the correct page with the 
        relative data loaded.
    */
    
    $("#schedule_btn").on('click', () => {
        $("#schedule_table_body").empty();
        loadClassroomSelectList("select_classroom");
        loadClassSelectList("select_class");
        showPage($("#schedule_page"));
    });
    
    $("#events_btn").on('click', () => {
        $("#schedule_event_table_body").empty();
        loadClassroomSelectList("select_event_classroom", "Esterno");
        loadClassSelectList("event_class");
        showPage($("#events_page"));
    });
    
    $("#prenotations_btn").on('click', () => {
        loadClassSelectList("select_prenotations");
        showPage($("#prenotations_page"));
    });

    $("#big_table_btn").on('click', () => {
        loadClassroomSchedule();
        showPage($("#big_table_page"));
    });
    
    /*
        fill the specified select list with the classrooms loaded from the database
        is possible to personalize the first option field adding a default message
    */
    function loadClassroomSelectList(select_classroom, defaultmsg) {
         $('#'+select_classroom).empty();
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        $('#'+select_classroom).append('<option>Seleziona aula</option>');
        if (defaultmsg != null) {
             $('#'+select_classroom).append('<option value="'+defaultmsg+'">'+ defaultmsg +'</option>');
        }
       
        
        /*
            get the reference to the database to obtain the list of the classrooms
        */
        const dbRef = firebase.database().ref('classroom/');
        
        var classroomList = dbRef.once('value', snap => {
            /*
                generate the html code for each classroom found on the database
            */
            snap.forEach(childSnap => {
                var name = childSnap.child('/classroom_name').val();
                var key = childSnap.key;
                $('#'+select_classroom).append('<option value="'+key+'">'+name+ '</option>');
            });
        });
    }

    /*
        fill the specified select list with the classes loaded from the database
        is possible to personalize the first option field adding a default message
    */
    function loadClassSelectList(select_class, defaultmsg) {
        /*
            check whether or not is specified a custom message, if not uses the premade one
        */
        if (defaultmsg == null) {
            defaultmsg = "Seleziona classe";
        }
        
        $('#'+select_class).empty();
        $('#'+select_class).append('<option>'+ defaultmsg +'</option>');
        
        /*
            get the reference to the database to obtain the list of classes
            and generate the html code for each class found on the database
        */
        firebase.database().ref('class/').once('value', snap => {
             snap.forEach(childSnap => {
                $('#'+select_class).append('<option>'+childSnap.key+'</option>');
            });
        });
    }   
    
    function loadClassroomSchedule() {
        //
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

            $("#big-table").append('<tr id="big-table-head"></tr>');
            $("#big-table-head").append("<th id='th-0'></th>");
            croom_keys.forEach((value, i) => {
                $("#big-table-head").append("<th id='th-"+(i+1)+"'></th>");
            });

            for (var hour = 8; hour<16; hour++) {
                $("#big-table").append(
                '<tr id="hid_'+hour+'" value="'+hour+'">'+
                '</tr>');
                $("#hid_"+hour).append('<th>'+hour+':00</th>');
                for(var i = 0; i < n_croom; i++) {
                    $("#hid_"+hour).append('<td id=cll-"'+hour+'-'+i+'"> </td>');
                }
            }

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
                        $("#hid_"+hour+" td:nth-child("+index+")").text(text);
                        if (event_title) {
                            $("#hid_"+hour+" td:nth-child("+index+")").addClass('reserved_event');           
                        } else {
                            $("#hid_"+hour+" td:nth-child("+index+")").addClass('reserved_lesson');
                        }
                    });
                });
            });
        });        
    }
});