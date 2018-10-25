$(function () {
    /*
        Handle the buttons on admin page, show the correct page with the 
        relative data loaded and page behaviour.
    */

    //----------------------------------------------------------------------------------- Navigation buttons   
    /*
        This listener hadble all 'back' buttons that allow the user to return to
        the admin page
    */
     $(".administration_page_btn").on('click', () => {
        showPage($("#administration_page"));
    })
    
    $("#admin_btn").on('click', () => {
        showPage($("#administration_page"));
    });

    $("#roles_and_permission_btn").on('click', () => {
        loadUsersList();
        showPage($("#roles_and_permission_page"));
    });

    $("#admin_classrooms_btn").on('click', () => {
        loadClassroomList();
        showPage($("#admin_classrooms_page"));
    });

    $("#admin_classes_btn").on('click', () => {
        loadClassList();
        showPage($("#admin_classes_page"));
    });

    $("#advanced_prenotations_btn").on('click', () => {
        showPage($("#admin_prenotation_page"));
    });

    $("#access_code_btn").on('click', () => {
        showPage($("#access_code_page"));
    });

    $("#announcement_btn").on('click', () => {
        showPage($("#announcement_page"));
    });

    //----------------------------------------------------------------------------------- Behaviour buttons
    $("#add_classroom_btn").on('click', () => {
        addClassroom();
    });

    $("#add_class_btn").on('click', () => {
        addClassToDb();
    });

    $(".administration_page_btn").on('click', () => {
        resetForms();
    });

    $("#get_code_btn").on('click', () => {
        var code;
        do {
            code = SecurityCodeUtility.generateCode();
        } while (!SecurityCodeUtility.readCode(code));
        $("#show_code").text(code);
    });

    $("#download_code_btn").on('click', () => {
        var code = [];
        for (var i = 0 ; i < 100; i++) {
            code[i] = SecurityCodeUtility.generateCode() + "\n";
        }

        var blob = new Blob(code, {type: "text/plain",endings:'native'});
        const object_URL = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.setAttribute("type", "hidden");
        a.href = object_URL;
        a.download = "codiciAccesso";
        document.body.appendChild(a);
        a.click();
    });

    //----------------------------------------------------------------------------------- Advanced prenotations
    DataFormFillUtility.createDayScheduleTable('advanced_schedule_table_body', proto_week_selection);

    var proto_week_selection = {
        selected_rows : 0,
        selected_hours : [[],[],[],[],[],[],[]]
    }

    var user_name = null;
    var user_key = null;

    $("#advanced_schedule_table_body").on('click', '.clickable-row', function(event) {
        var day = $('#adv_select_day').val();
        if ($(this).hasClass('d-'+day)) {
            var s_hour = parseInt($(this).attr('value'));
            if ($(this).hasClass('selected_row')) {
                $(this).removeClass('selected_row');
                proto_week_selection.selected_rows--;
                var idx = proto_week_selection.selected_hours[day].indexOf(s_hour);
                if (idx >= 0) proto_week_selection.selected_hours[day].splice(idx, 1);
            } else {
                $(this).addClass('selected_row');
                proto_week_selection.selected_hours[day].push(s_hour);
                proto_week_selection.selected_rows++;
            }
        }
        console.log(proto_week_selection.selected_rows);
    });

    $('#adv_user_select').on('change', () => {
        user_key = $('#adv_user_select').val();
        if (user_key != null) {
            firebase.database().ref('user/'+user_key).once('value',snap => {
                user_name = snap.val().name + ' ' + snap.val().surname;
            });
        }
    });

    jQuery('#datetimepicker4').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    jQuery('#datetimepicker5').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#select_adv_prenotation').on('change', () => {
        $('#proto_week_selection').slideDown();
        $('#adv_datepicker').slideDown();

        if ($('#select_adv_prenotation').val() == 0) {
            $('#advanced_croom_prenotation').slideDown();
            $('#advanced_event_creation').slideUp();
        } else {
            $('#advanced_event_creation').slideDown();
            $('#advanced_croom_prenotation').slideUp();
        }
    });

    $('#adv_prenotation_back_btn').on('click', () => {
        prenotationDone();
    });

    $('#select_adv_prenotation').on('change', () => {
        switch ($('#select_adv_prenotation').val()) {
            case '0': //classroom prenotation
                DataFormFillUtility.loadClassroomSelectList('adv_croom_select');
                DataFormFillUtility.loadClassSelectList('adv_class_select');
                DataFormFillUtility.loadUserSelectList('adv_user_select');
                break;
            case '1': //event organizzation
                DataFormFillUtility.loadClassroomSelectList('adv_event_croom_select');
                break;
            default:
                break;
        }
    });

    $('#adv_select_day').on('change', () => {
        DataFormFillUtility.loadDayScheduleTable('advanced_schedule_table_body', proto_week_selection, parseInt($('#adv_select_day').val()));
    }); 
    
    $('#adv_prenotation_btn').on('click', () => {
        var prenotation_ok = false;
        if ($('#select_adv_prenotation').val() != null) {
            var first_day = $("#datetimepicker4").datetimepicker('getValue');
            var last_day = $("#datetimepicker5").datetimepicker('getValue');

            if (first_day == null) {
                first_day = new Date();
            }

            if (last_day == null) {
                last_day = new Date();
            }
            switch (parseInt($('#select_adv_prenotation').val())) {
                case 0:
                    if (wellFilledForm('adv_croom_select') && wellFilledForm('adv_class_select')) {
                        prenotation_ok = true;
                    } else {
                        var error_msg = "";

                        if (!wellFilledForm('adv_croom_select')) {
                            error_msg += 'Seleziona un\'aula.\n';
                        }

                        if (!wellFilledForm('adv_class_select')) {
                            error_msg += 'Seleziona una classe.\n';
                        }

                        alert(error_msg);
                        prenotation_ok = false;
                    }
                break;
                
                case 1:
                    if (wellFilledForm('adv_event_title') && wellFilledForm('adv_e_desc' )&& wellFilledForm('adv_event_croom_select')) {
                        prenotation_ok = true;
                    } else {
                        var error_msg = "";

                        if (!wellFilledForm('adv_event_title')) {
                            error_msg += 'Inserisci un titolo per l\'evento.\n';
                        }

                        if (!wellFilledForm('adv_e_desc')) {
                            error_msg += 'Inserisci una descrizione per l\'evento.\n';
                        }

                        if (!wellFilledForm('adv_event_croom_select')) {
                            error_msg += 'Seleziona un\'aula per l\'evento.\n';
                        }

                        alert(error_msg);
                        prenotation_ok = false;
                    }
                break;

                default:
                ;
            }

            if (prenotation_ok) {
                if (!proto_week_selection.selected_rows > 0) {
                    console.log('ERRORE: ' + proto_week_selection.selected_rows);
                    alert('Seleziona l\'orario per la prenotazione');
                    prenotation_ok = false;
                }
            }
        } else {
            alert('Seleziona la modalità di prenotazione.')
        }

        if (prenotation_ok) {
            
            if ((user_name == null) || (user_key == null)) {
                var user = firebase.auth().currentUser;
                user_name = user.displayName;
                user_key = user.uid;
            }

            var teacher_name = user_name;
            var teacher_key = user_key;
            var temp_date = first_day;
            
            switch (parseInt($('#select_adv_prenotation').val())) {
                
                case 0:
                    var selected_classroom_name = $('#adv_croom_select').find(':selected').text();
                    var selected_classroom_key = $('#adv_croom_select').val();
                    var selected_class = $('#adv_class_select').val();

                    console.log(teacher_key+'\n'+teacher_name+'\n'+selected_classroom_name+'\n'+selected_class+'\n'+temp_date+'\n'+proto_week_selection)
                    while (temp_date <= last_day) {
                        makePrenotation(teacher_key, teacher_name, selected_classroom_name, selected_classroom_key, selected_class, temp_date, proto_week_selection);
                        temp_date.setDate(temp_date.getDate() + 1);
                    }
                break;
                case 1:
                    var selected_classroom_name = $('#adv_event_croom_select').find(':selected').text();
                    var selected_classroom_key = $('#adv_event_croom_select').val();
                    var title = $('#adv_event_title').val();
                    var desc = $('#adv_e_desc').val();

                    var event_key = createEvent(teacher_key, teacher_name, title, selected_classroom_name, selected_classroom_key, desc, temp_date);
                    var cnt = 0;
                    while (temp_date <= last_day) {
                        var datename = 'date-' + cnt;
                        firebase.database().ref('event/'+event_key+'/period').update({
                            [datename] : temp_date.getTime()
                        });
                        eventPrenotation(title, event_key, selected_classroom_name, selected_classroom_key, temp_date, proto_week_selection);
                        temp_date.setDate(temp_date.getDate() + 1);
                        cnt++;
                    }
                break;
                default:
            }

            prenotationDone();
        } else {
            console.log('ERRORE: prenotazione non eseguita');
        }
    });

    function makePrenotation(teacher_key, teacher_name, selected_classroom_name, selected_classroom_key, temp_date, week_schedule) {
        var tmp_day = temp_date.getDate();
        var tmp_month = temp_date.getMonth() + 1;
        var tmp_year = temp_date.getFullYear();
        var day = temp_date.getDay() - 1;
        if (day < 0) day = 6;

        var promises_select = [];
        var promise_remove = [];

        var toRemove = {class_name:[], hour:[]};
        for (i in week_schedule.selected_hours[day]) {
            var hour = week_schedule.selected_hours[day][i];
            var my_prom = firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour).once('value', function(snap)  {
                if (snap.exists()) {
                    toRemove.class_name.push(snap.val().class);
                    toRemove.hour.push(this.h);
                }
            }.bind({h : hour}));
            promises_select.push(my_prom);
        }

        Promise.all(promises_select).then(() => {
            console.log(toRemove);
            for (i in week_schedule.selected_hours[day]) {
                var my_prom = firebase.database().ref('class/'+toRemove.class_name[i]+'/prenotation/'+tmp_day+"-"+tmp_month+'-'+tmp_year+'/'+toRemove.hour[i]+'/').remove();
                promise_remove.push(my_prom);
            }

            Promise.all(promise_remove).then(() => {
                for (i in week_schedule.selected_hours[day]){
                    var hour = week_schedule.selected_hours[day][i];
                    firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour+'/').set({
                        class : selected_class,
                        classroom : selected_classroom_name,
                        teacher : teacher_name,
                        teacher_key : teacher_key
                    });
                    firebase.database().ref('class/'+selected_class+'/prenotation/'+tmp_day+"-"+tmp_month+'-'+tmp_year+'/').update({
                        [hour] : selected_classroom_name
                    });
                }
            });
        });
    }

    function eventPrenotation(title, e_key, selected_classroom_name, selected_classroom_key, temp_date, week_schedule) {
        var tmp_day = temp_date.getDate();
        var tmp_month = temp_date.getMonth() + 1;
        var tmp_year = temp_date.getFullYear();
        var day = temp_date.getDay() - 1;
        if (day < 0) day = 6;

        var promises_select = [];
        var promise_remove = [];

        var toRemove = {class_name:[], hour:[]};
        for (i in week_schedule.selected_hours[day]) {
            var hour = week_schedule.selected_hours[day][i];
            var my_prom = firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour).once('value', function(snap)  {
                if (snap.exists()) {
                    toRemove.class_name.push(snap.val().class);
                    toRemove.hour.push(this.h);
                }
            }.bind({h : hour}));
            promises_select.push(my_prom);
        }

        Promise.all(promises_select).then(() => {
            console.log(toRemove);
            for (i in week_schedule.selected_hours[day]) {
                var my_prom = firebase.database().ref('class/'+toRemove.class_name[i]+'/prenotation/'+tmp_day+"-"+tmp_month+'-'+tmp_year+'/'+toRemove.hour[i]+'/').remove();
                promise_remove.push(my_prom);
            }

            Promise.all(promise_remove).then(() => {
                for (i in week_schedule.selected_hours[day]){
                    var hour = week_schedule.selected_hours[day][i];
                    firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour+'/').set({
                        classroom : selected_classroom_name,
                        event_key : e_key,
                        event : title,
                    });
                }
            });
        });
    }

    function createEvent(t_key, t_name, title, croom_name, croom_key, description, date) {
        var r_date = date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
        var event = firebase.database().ref().child('event/').push({
            title : title,
            classroom : croom_name,
            classroom_key : croom_key,
            date : date.getTime(),
            teacher : t_name,
            teacher_key : t_key,
            description : description,
            readable_date : r_date
        });

        return event.key;
    }

    function wellFilledForm(form) {
        return ($('#'+form).val() != null);
    }

    function prenotationDone() {
        $(".d-row").removeClass('selected_row');
        $('#proto_week_selection').slideUp();
        $('#advanced_event_creation').slideUp();
        $('#advanced_croom_prenotation').slideUp();
        $('#adv_datepicker').slideUp();
        showPage($("#administration_page"));

        resetForms();
        proto_week_selection = {
            selected_rows : 0,
            selected_hours : [[],[],[],[],[],[],[]]
        }
    }

    function resetForms() {
        //adv prenotation
        $('#adv_event_title').val('');
        $('#adv_e_desc').val('');
        $('#classroom_name').val('');
        $('#classroom_capacity').val('');
        //$('#classclass_nameroom_capacity').val(''); //?????????????
        $('#n_of_students').val('');
        $('#class_name').val('');
        $('#show_code').text('CODICE');
        $('#adv_event_croom_select').get(0).selectedIndex = 0;
        $('#select_adv_prenotation').get(0).selectedIndex = 0;
        $('#adv_croom_select').get(0).selectedIndex = 0;
        $('#adv_class_select').get(0).selectedIndex = 0;
        $('#adv_user_select').get(0).selectedIndex = 0;
        $('#adv_select_day').get(0).selectedIndex = 0;
        $('#datetimepicker4').datetimepicker('reset');
        $('#datetimepicker5').datetimepicker('reset');
        //announcement
        $('#announcement_title').val('');
        $('#announcement_desc').val('');
        $('#select_announcement_action').get(0).selectedIndex = 0;
        $('#announcement_select').empty();
        $('#datetimepicker7').datetimepicker('reset');
        $('#datetimepicker8').datetimepicker('reset');
    }

    //----------------------------------------------------------------------------------- Announcements

    jQuery('#datetimepicker7').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    jQuery('#datetimepicker8').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#select_announcement_action').on('change', () => {
        $('#announcement_datepicker').slideDown();

        if ($('#select_announcement_action').val() == 0) {
            $('#create_announcement').slideDown();
            $('#remove_announcement').slideUp();
        } else {
            $('#remove_announcement').slideDown();
            $('#create_announcement').slideUp();
            fillAnnouncementSelectList();
        }
    });

    $('#datetimepicker7, #datetimepicker8').on('change', () => {
        fillAnnouncementSelectList();
    });

    $('#announcement_back_btn').on('click', () => {
        announcement_done();
    });

    $('#send_announcement').on('click', () => {
        var announcement_title = $('#announcement_title').val();
        var announcement_desc = $('#announcement_desc').val();
        var today = new Date();
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        var startDate = $("#datetimepicker7").datetimepicker('getValue');
        var endDate = $("#datetimepicker8").datetimepicker('getValue');

        if (startDate == null) {
            startDate = today;
        }

        if (endDate == null) {
            endDate = today;
        }

        if (announcement_title != '' && announcement_desc != '' && startDate.getTime() > yesterday.getTime() && endDate.getTime() > startDate.getTime()) {
            firebase.database().ref('announcement/').push().set({
                title : announcement_title,
                description : announcement_desc,
                startDate : startDate.getTime(),
                endDate : endDate.getTime()
            }).then(() => {
                announcement_done();
            });
        } else {
            var error_msg = '';
            if ($('#announcement_title').val() != '') error_msg += 'Inserisci un titolo per l\'annuncio\n';
            if ($('#announcement_desc').val() != '') error_msg += 'Inserisci una descrizione per l\'annuncio\n';
            if (startDate.getTime() < yesterday.getTime() || endDate.getTime() < startDate.getTime()) error_msg += 'Periodo inserito non valido\n';
            alert(error_msg);
        }
    });

    $('#delete_announcement').on('click', snap => {
        deleteAnnouncement();
    });

    function fillAnnouncementSelectList() {
        $('#announcement_select').empty();
        $('#announcement_select').append('<option value="" disabled selected>Seleziona annuncio</option>');
        var startDate = $("#datetimepicker7").datetimepicker('getValue');
        var endDate = $("#datetimepicker8").datetimepicker('getValue');
        var today = new Date();
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (startDate == null) {
            startDate = today;
        }

        if (endDate == null) {
            endDate = today;
        }

        firebase.database().ref('announcement/').once('value', snap => {
            snap.forEach(childSnap => {
                if (childSnap.val().endDate >= startDate.getTime() && childSnap.val().startDate <= endDate.getTime()) {
                    $('#announcement_select').append('<option value="'+childSnap.key+'">'+childSnap.val().title+'</option>')
                }
            });
        });
    }

    function deleteAnnouncement() {
        var announcement_key = $('#announcement_select').val();
        if (announcement_key != null) {
            firebase.database().ref('announcement/'+ announcement_key).remove();
            announcement_done();
        } else {
            alert('Seleziona un annuncio da eliminare.');
        }
    }

    function announcement_done() {
        $('#create_announcement').hide();
        $('#remove_announcement').hide();
        $('#announcement_datepicker').hide();
        resetForms();
        showPage($("#administration_page"));
    }
    //-----------------------------------------------------------------------------------

    /*
        Fill the users table in "Roles and permission" page.
    */
    function loadUsersList() {
        
        /*
            Empty the table
        */
        $("#user_table_body").empty();
        
        /*
            Get database reference and the user reference from firebase
        */
        const USER = firebase.auth().currentUser;
        const dbRef = firebase.database().ref('user/');
        
        /*
            For each user added to the istitute, retrives the name, the confirmation value
            and the admin value and insert this values in a table row.
        */
        dbRef.on('value', snap => {
            snap.forEach(childSnap => {
                if (USER.uid != childSnap.key) {
                    var name;
                    var surname;
                    var priviledges;

                    name = childSnap.val().name;
                    surname = childSnap.val().surname;
                    priviledges = childSnap.val().priviledges;

                    /*
                        Create in the table row two buttons to allow the user to modify these values.
                        
                        The user cannot modify his own values to prevent the possibility of removing all administrators.
                    */

                    switch(priviledges) {
                        case "1" :
                            $("#user_table_body").append('<tr><td>'+name+' '+surname+'</td>'+
                            '<form><td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="1" checked></td>'+ 
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="2"></td>'+
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="3"></td></form></tr>');
                        break;
                        case "2" :
                            $("#user_table_body").append('<tr><td>'+name+' '+surname+'</td>'+
                            '<form><td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="1"></td>'+ 
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="2" checked></td>'+
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="3"></td></form></tr>');
                        break;
                        case "3" :
                            $("#user_table_body").append('<tr><td>'+name+' '+surname+'</td>'+
                            '<form><td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="1"></td>'+ 
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="2"></td>'+
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="3" checked></td></form></tr>');
                        break;
                    }

                    /*
                        Attach listeners to modifty privileges.
                    */
                    $('.radio-'+childSnap.key).change( function() {
                        /*
                            Get reference to the user bounded with the pressed button.
                        */
                        user_ref = dbRef.child(childSnap.key);
                        var accessLevel = this.value;
                        user_ref.update({
                            priviledges: accessLevel
                        });
                        loadUsersList();
                    });
                }
            });
        });
    }

    function addClassroom() {
        
        /*
            Gets values from the forms
        */
        const classroomName = $("#classroom_name")[0];
        const classroomCapacity = $("#classroom_capacity")[0];
        
        /*
            Get the reference from the database
        */
        const dbRef = firebase.database().ref();
        
        /*
            Check the retrived values
        */
        if (classroomName.value != '' && classroomCapacity.value != '') {
            
            /*
                Create the new classroom based on the values from the forms
            */
            dbRef.child('classroom').push({
                classroom_name : classroomName.value,
                classroom_capacity : classroomCapacity.value
            }).catch(error => console.log('user not updated ' + error.message)).then(() =>{
                $("#classroom_name").val("");
                $("#classroom_capacity").val("");
                loadClassroomList();
            });
        }
    }

    /*
        Load the classrooms table in the classroom page
    */
    function loadClassroomList() {
        $("#admin_classroom_table_body").empty();
        const dbRef = firebase.database().ref('classroom/');
        dbRef.once('value', snap => {
            snap.forEach(childSnap => {
                var key =  childSnap.key;
                var name;
                
                name = childSnap.val().classroom_name;
                isFavourite = childSnap.val().isFavourite;

                var my_btn = '<tr><td>'+name+'</td>'+'<td><input class="favourite_croom" id="croom_'+key+'" type="checkbox" value="'+key+'""></td>'+
                '<td><button id="'+ key +'" class="btn btn-primary btn-sm" type="button">X</button></td></tr>';

                $("#admin_classroom_table_body").append(my_btn);

                if (isFavourite) {
                    $('#croom_'+key).attr('checked','checked');
                }

                $('#croom_'+key).click(() => {
                    var classroom = $('#croom_'+key).val();
                    if($('#croom_'+key).is(':checked')){
                        firebase.database().ref('classroom/'+classroom+'/').update({
                            isFavourite : true
                        });
                    } else {
                        firebase.database().ref('classroom/'+classroom+'/').update({
                            isFavourite : false
                        });
                    }
                });

                $("#"+key).on('click', () => {
                    $("#admin_classroom_table_body").empty();
                    dbRef.child(key).remove();
                    loadClassroomList();
                });
            });
        });
    }

    /*
        Create a new class
    */
    function addClassToDb() {
        var className = $("#class_name")[0].value;
        var nOfStudents = $("#n_of_students")[0].value;
        
        if (className && className != '' && nOfStudents) {
            
            firebase.database().ref('class/'+className).set({
                number_of_students : nOfStudents
            }).catch(error => console.log(error.message)).then(() =>{
                $("#class_name").val("");
                $("#n_of_students").val("");
                loadClassList();
            });
        } else {
            console.log('wrong form compilation');
        }
    }

    /*
        Load class select list in class page.
    */
    function loadClassList() {
        $("#admin_classes_table_body").empty();
        const dbRef = firebase.database().ref('class/');
        
        dbRef.once('value', snap => {
            
            snap.forEach(childSnap => {
                var className = childSnap.key;
                var numberOfStudents;
                
                childSnap.forEach(gcSnap => {
                    
                    if (gcSnap.key == "number_of_students") {
                        numberOfStudents = gcSnap.val();
                    }
                });
                
                /*
                    For each row created add a buttom to remove the lass from the database
                */
                var tableRow = '<tr><td>'+className+'</td><td>'+numberOfStudents+'</td>'+'<td><button id="'+ className +'" class="btn btn-primary btn-sm" type="button">X</button></td></tr>';
                $("#admin_classes_table_body").append(tableRow);
                
                $("#"+className).on('click', () => {
                    $("#admin_class_table_body").empty();
                    dbRef.child(className).remove();
                    loadClassList();
                });
            })
        });
    }
});
