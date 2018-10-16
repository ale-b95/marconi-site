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
    var proto_week_selection = {
        selected_rows : 0,
        selected_hours : [[],[],[],[],[],[],[]]
    }


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
        if ($('#adv_select_day').val() != null) {
            DataFormFillUtility.loadDayScheduleTable('advanced_schedule_table_body', proto_week_selection, parseInt($('#adv_select_day').val(), 10));
        }   
    }); 
    
    $('#adv_prenotation_btn').on('click', () => {
        var prenotation_ok = false;
        if ($('#select_adv_prenotation').val() != null) {
            switch (parseInt($('#select_adv_prenotation').val())) {
                case 0:
                    if (wellFilledForm('adv_croom_select') && wellFilledForm('adv_class_select') && wellFilledForm('adv_user_select')) {
                        var first_week = $("#datetimepicker4").datetimepicker('getValue');
                        var last_week = $("#datetimepicker5").datetimepicker('getValue');

                        if (first_week == null) {
                            first_week = new Date();
                        }

                        if (last_week == null) {
                            last_week = new Date();
                        }
                        prenotation_ok = true;
                    } else {
                        var error_msg = "";
                        if (!wellFilledForm('adv_croom_select')) {
                            error_msg += 'Seleziona un\'aula.\n';
                        }

                        if (!wellFilledForm('adv_class_select')) {
                            error_msg += 'Seleziona una classe.\n';
                        }

                        if (!wellFilledForm('adv_user_select')) {
                            error_msg += 'Seleziona un utente.\n';
                        }

                        alert(error_msg);
                        prenotation_ok = false;
                    }
                break;

                case 1:
                break;

                default:
                ;
            }

            if (prenotation_ok) {
                if (!proto_week_selection.selected_rows > 0) {
                    alert('Seleziona l\'orario per la prenotazione');
                    prenotation_ok = false;
                }
            }
        } else {
            alert('Seleziona la modalità di prenotazione.')
        }

        if (prenotation_ok) {
            console.log('effettuo prenotazione da settimana del:' + first_week + '\nalla settimana del: ' + last_week);
            prenotationDone();
        }
    });

    function wellFilledForm(form) {
        return ($('#'+form).val() != null);
    }

    function prenotationDone() {
        $("#advanced_schedule_table_body").empty();
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
        $('#adv_event_title').val('');
        $('#adv_e_desc').val('');
        $('#classroom_name').val('');
        $('#classroom_capacity').val('');
        $('#classclass_nameroom_capacity').val('');
        $('#n_of_students').val('');
        $('#class_name').val('');
        $('#show_code').text('CODICE');
        $('#adv_event_croom_select').get(0).selectedIndex = 0;
        $('#select_adv_prenotation').get(0).selectedIndex = 0;
        $('#adv_croom_select').get(0).selectedIndex = 0;
        $('#adv_class_select').get(0).selectedIndex = 0;
        $('#adv_user_select').get(0).selectedIndex = 0;
        $('#adv_select_day').get(0).selectedIndex = 0;
        $('#datetimepicker4').datetimepicker('show').datetimepicker('reset');
        $('#datetimepicker5').datetimepicker('show').datetimepicker('reset');
    }
    

    //----------------------------------------------------------------------------------- Functions



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
        var classroomList =  dbRef.once('value', snap => {
            snap.forEach(childSnap => {
                var key =  childSnap.key;
                var name;
                var capacity;
                
                childSnap.forEach(gcSnap => {
                    if (gcSnap.key == 'classroom_name') {
                        name = gcSnap.val();
                    } else if (gcSnap.key == 'classroom_capacity'){
                        capacity = gcSnap.val();
                    }
                });
                var my_btn = '<tr><td>'+name+'</td>'+'<td>'+capacity+'</td>'+'<td><button id="'+ key +'" class="btn btn-primary btn-sm" type="button">X</button></td></tr>';
                $("#admin_classroom_table_body").append(my_btn);

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
