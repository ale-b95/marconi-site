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

    //----------------------------------------------------------------------------------- Behaviour buttons
    $("#add_classroom_btn").on('click', () => {
        addClassroom();
    });

    $("#add_class_btn").on('click', () => {
        addClassToDb();
    });

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
        const dbRef = firebase.database().ref('institute/' + INSTITUTE_ID + '/user/');
        
        /*
            For each user added to the istitute, retrives the name, the confirmation value
            and the admin value and insert this values in a table row.
        */
        var user_list = dbRef.on('value', snap => {
            
            snap.forEach(childSnap => {
                var name;
                var admin = null;
                var confirmed = null;
                
                childSnap.forEach(gcSnap => {
                    
                    if (gcSnap.key == 'name') {
                        name = gcSnap.val();
                    } else if (gcSnap.key == 'admin'){
                        admin = gcSnap.val();
                    } else if (gcSnap.key == 'confirmed'){
                        confirmed = gcSnap.val();
                    }
                });

                if (confirmed == null) {
                    confirmed = 'false';
                }

                if (admin == null) {
                    admin = 'false';
                }

                /*
                    Create in the table row two buttons to allow the user to modify these values.
                    
                    The user cannot modify his own values to prevent the possibility of removing all administrators.
                */
                $("#user_table_body").append('<tr id="'+childSnap.key+'"><td>'+name+'</td>'+'<td><button class="btn btn-primary btn-sm conf_btn" type="button">'+confirmed+'</button></td>'+ '<td><button class="btn btn-primary btn-sm admin_btn" type="button">'+admin+'</button></td></tr>');
                
                /*
                    Attach to the nearly generated buttons listeners to modifty admin and access privileges.
                */
                $("#"+childSnap.key+" .conf_btn").on('click', function() {
                    
                    /*
                        Get reference to the user bounded with the pressed button.
                    */
                    institute_user_ref = dbRef.child(childSnap.key);
                    
                    /*
                        Check whether the user whos privileges are going to be modified is the current user and
                        if not allow the modifications.
                    */
                    if (USER.uid != childSnap.key) {
                        
                        if (confirmed == true) {
                            
                            institute_user_ref.update({
                                confirmed: false,
                                admin: false
                            });
                            
                            $("#"+childSnap.key+" .conf_btn").text('false');
                            $("#"+childSnap.key+" .admin_btn").text('false');
                            
                        } else {
                            
                            institute_user_ref.update({
                                confirmed: true
                            });
                            
                            $("#"+childSnap.key+" .conf_btn").text('true');
                        }
                    } else {
                        alert('Cannot modify your own privileges')
                    }

                    loadUsersList();
                });

                $("#"+childSnap.key+" .admin_btn").on('click', function() {
                    institute_user_ref = dbRef.child(childSnap.key);
                    
                    if (USER .uid != childSnap.key) {
                        
                        if (admin == true) {
                            
                            institute_user_ref.update({
                                admin: false
                            });
                            
                            $("#"+childSnap.key+" .admin_btn").text('false');
                            
                        } else {
                            
                            institute_user_ref.update({
                                admin: true,
                                confirmed: true
                            });
                            
                            $("#"+childSnap.key+" .admin_btn").text('true');
                            $("#"+childSnap.key+" .conf_btn").text('true');
                        }
                    } else {
                        alert('Cannot modify your own privileges');
                    }
                    loadUsersList();
                });
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
            dbRef.child('institute/'+INSTITUTE_ID+'/classroom').push({
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
        const dbRef = firebase.database().ref('institute/' + INSTITUTE_ID + '/classroom/');
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
            
            firebase.database().ref('institute/' +INSTITUTE_ID+ '/class/'+className).set({
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
        const dbRef = firebase.database().ref('institute/' + INSTITUTE_ID + '/class/');
        
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
