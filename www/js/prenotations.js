$(function () {    
    /*
        List the the event the selected class have joined
    
    $("#select_prenotations").on('change', () => {
        $("#prenotations_list").empty();
        if ($("#select_prenotations").find(':selected').text() != "Seleziona classe") {
            
            var class_name = $("#select_prenotations").find(':selected').text();
            var ref = firebase.database().ref('class/'+class_name+'/event/').orderByChild("date");
            ref.once('value', snap => {
                snap.forEach(childSnap => {
                    var title = childSnap.val().title; 
                    var date = childSnap.val().date;;
                
                    $("#prenotations_list").append('<li class="list-group-item">'+title+'   '+date+'</li>');
                });
            });
        }
    });
    */

    function loadClassroomSchedule() {
        /*
        $("#class_pren_body").empty();

        for (var hour = 8; hour<25; hour++) {
            $("#class_pren_body").append(
            '<tr id="hid_'+hour+'" value="'+hour+'">'+
            '<th>'+hour+':00</th><td></td>'+
            '</tr>');
        }

        pRef.once('value', snap => {
            
            snap.forEach(childSnap => {
                var hour = childSnap.key;
                var teacher_name;
                var class_name;
                var event_title;
                var event_key;
                var second_column;
                var teacher_id;
                childSnap.forEach(gcSnap => {
                    
                    if (gcSnap.key == 'teacher') {
                        teacher_name = gcSnap.val();
                    } else if (gcSnap.key == 'event') {
                        event_title = gcSnap.val();
                    } else if (gcSnap.key == 'class') {
                        class_name =  gcSnap.val();
                    } else if (gcSnap.key == 'event_key') {
                        event_key = gcSnap.val();
                    } else if (gcSnap.key == 'teacher_key') {
                        teacher_id = gcSnap.val();
                    }
                }); 

                if (event_title) {
                    second_column = event_title;
                } else {
                    second_column = class_name + ' ' + teacher_name;
                }

                $("#hid_"+hour).empty();
                $("#hid_"+hour).append('<th>'+hour+':00</th><td>'+ second_column +'</td>');
                
                if (event_title) {
                    $("#hid_"+hour).addClass('event_prenotation');
                    $("#hid_"+hour).val(event_key);              
                } else {
                    var user = firebase.auth().currentUser;
                
                    if (user.uid == teacher_id){
                        $("#hid_"+hour).addClass('mybook');
                    } else {
                        $("#hid_"+hour).addClass('booked');
                        $("#hid_"+hour).removeClass('clickable-row');
                    }
                }
            });
        });*/
    }
});