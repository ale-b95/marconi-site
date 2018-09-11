$(function() {
    loadClassroomSchedule();
    /*
       Insert the rows with the prenotation for the selected day and the selected classroom
    */
    function loadClassroomSchedule() {
        var date = new Date();
        var croom_keys = [];
        firebase.database().ref('classroom/').once('value', snap => {
            snap.forEach(childSnap => {
                croom_keys.push(childSnap.key);
            });
        }).then(() => {
            var n_croom = croom_keys.length;
            var width = 100/n_croom + '%';
            $(".big-table tbody td").css({
                "float": "left",
                "width": width,
                "height": "80px"
            });

            for (var hour = 8; hour<16; hour++) {
                $("#big-table").append(
                '<tr id="hid_'+hour+'" value="'+hour+'">'+
                '</tr>');
                $("#hid_"+hour).append('<th>'+hour+':00</th>');
                for(var i = 0; i < n_croom; i++) {
                    $("#hid_"+hour).append('<td id=cll-"'+hour+'-'+i+'"></td>');
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
                        var event_key = childSnap.val().event_key;
                        var teacher_id = childSnap.val().teacher_key;
                        var second_column;

                        if (event_title) {
                            second_column = event_title;
                        } else {
                            second_column = class_name + ' ' + teacher_name;
                        }

                        $("#hid_"+hour+" td:nth-child("+index+")").text(second_column);

                        if (event_title) {
                            $("#hid_"+hour+" td:nth-child("+index+")").addClass('event_prenotation');
                            $("#hid_"+hour+" td:nth-child("+index+")").val(event_key);              
                        } else {
                            var user = firebase.auth().currentUser;
                            if (user.uid == teacher_id){
                                $("#hid_"+hour+" td:nth-child("+index+")").addClass('mybook');
                            } else {
                                $("#hid_"+hour+" td:nth-child("+index+")").addClass('booked');
                                $("#hid_"+hour+" td:nth-child("+index+")").removeClass('clickable-row');
                            }
                        }
                    });
                });
            });
        });        
    }
});