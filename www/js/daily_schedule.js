$(function() {
    loadClassroomSchedule();
    /*
       Insert the rows with the prenotation for the selected day and the selected classroom
    */
    function loadClassroomSchedule() {
        var date = new Date();
        for (var hour = 8; hour<16; hour++) {
            $("#big_table").append(
            '<tr id="hid_'+hour+'" value="'+hour+'">'+
            '<th>'+hour+':00</th><td></td>'+
            '</tr>');
        }

        var pRef = firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/-LKziy2PL5xXk222mDpW/');
        pRef.once('value', snap => {
            
            snap.forEach(childSnap => {
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
        });
    }
});