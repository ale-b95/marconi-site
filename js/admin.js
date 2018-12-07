var Admin = {
    selected_user : null,
    resetForms : function() {
        //adv prenotation
        $('#classroom_name').val('');
        $('#class_name').val('');
        $('#show_code').text('CODICE');
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
}

$(function () {
    Announcement.init();
    AdvancedOperations.init();
    
    /*
        Handle the buttons on admin page, show the correct page with the 
        relative data loaded and page behaviour.
    */

    //----------------------------------------------------------------------------------- Navigation buttons   
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
        DataFormFillUtility.loadClassroomSelectList('adv_croom_select');
        DataFormFillUtility.loadClassSelectList('adv_class_select');
        DataFormFillUtility.loadUserSelectList('adv_user_select');
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

    $('#user_dell_btn').on('click', () => {
        firebase.database().ref('user/'+Admin.selected_user).update({
            priviledges : "-1"
        });

        $('#user_dell_btn').slideUp();

        loadUsersList();
    });
    
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
        const dbRef = firebase.database().ref('user/').orderByChild('name');
        
        /*
            For each user added to the istitute, retrives the name, the confirmation value
            and the admin value and insert this values in a table row.
        */
        dbRef.once('value', snap => {
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
                        case "0" :
                            $("#user_table_body").append('<tr><td>'+name+' '+surname+'</td>'+
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="0" checked></td>'+
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="1"></td></form>'+
                            '<td><button class="btn btn-primary btn-sm usr_dell" id="dell-btn-'+childSnap.key+'" value="'+childSnap.key+'">X</td></tr>');
                        break;
                        case "1" :
                            $("#user_table_body").append('<tr><td>'+name+' '+surname+'</td>'+
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="0"></td>'+
                            '<td><input class="radio-'+childSnap.key+'" type="radio" name="'+childSnap.key+'" value="1" checked></td></form>'+
                            '<td><button class="btn btn-primary btn-sm usr_dell" id="dell-btn-'+childSnap.key+'" value="'+childSnap.key+'">X</td></tr>');
                        break;
                    }

                    $('#dell-btn-'+childSnap.key).on('click', () => {
                        Admin.selected_user = childSnap.key;
                        user_dell_btn
                        $('#user_dell_btn').slideDown();
                    });

                    /*
                        Attach listeners to modifty privileges.
                    */
                    $('.radio-'+childSnap.key).change( function() {
                        /*
                            Get reference to the user bounded with the pressed button.
                        */
                        user_ref = firebase.database().ref('user/' + childSnap.key);
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
        const classroomName = $("#classroom_name")[0].value;

        firebase.database().ref('classroom/').orderByChild("name").equalTo(classroomName).once('value', snap => {
            if (snap.exists()){ 
                return exists = true;
            } else {
                return exists = false;
            }
        }).then(() => {
            if (!exists) {
                if (classroomName != '') {
                    /*
                        Create the new classroom based on the values from the forms
                    */
                    firebase.database().ref('classroom/').push({
                        name : classroomName,
                    }).then(() =>{
                        $("#classroom_name").val("");
                        loadClassroomList();
                    });
                }
            } else {
                alert('Nome aula già presente');
            }
        });        
    }

    /*
        Load the classrooms table in the classroom page
    */
    function loadClassroomList() {
        $("#admin_classroom_table_body").empty();
        const dbRef = firebase.database().ref('classroom/').orderByChild("classroom_name");
        dbRef.once('value', snap => {
            snap.forEach(childSnap => {
                var key = childSnap.key;
                var name;
                
                name = childSnap.val().name;
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
                    firebase.database().ref('classroom/'+key).remove();
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

        firebase.database().ref('class/').orderByChild("name").equalTo(className).once('value', snap => {
            if (snap.exists()){ 
                return exists = true;
            } else {
                return exists = false;
            }
        }).then(() => {
            if (!exists) {
                if (className && className != '') {
                    firebase.database().ref('class/').push({
                        name : className
                    }).then(() =>{
                        $("#class_name").val("");
                        loadClassList();
                    });
                }
            } else {
                alert('Nome classe già presente');
            }
        });
    }

    /*
        Load class select list in class page.
    */
    function loadClassList() {
        $("#admin_classes_table_body").empty();
        const dbRef = firebase.database().ref('class/').orderByChild('name');
        
        dbRef.once('value', snap => {
            snap.forEach(childSnap => {
                var classKey = childSnap.key;
                var className = childSnap.val().name;
                
                /*
                    For each row created add a buttom to remove the lass from the database
                */
                var tableRow = '<tr><td>'+className+'</td><td><button id="'+ classKey +'" class="btn btn-primary btn-sm" type="button">X</button></td></tr>';
                $("#admin_classes_table_body").append(tableRow);
                
                $("#"+classKey).on('click', () => {
                    $("#admin_class_table_body").empty();
                    firebase.database().ref('class/'+classKey).remove();
                    loadClassList();
                });
            })
        });
    }
});
