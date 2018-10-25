$(function () {
    var class_name;
    var prn_date;

    jQuery('#datetimepicker2').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#datetimepicker2, #select_class_pren').on('change', () => {
        $("#class_pren_body").empty();
        prn_date = $("#datetimepicker2").datetimepicker('getValue');
        if (classroom_name != 'Seleziona aula') {
            class_name = $("#select_class_pren").find(':selected').text();

            var occupied_h = [];
            var occupied_cls = [];
    
            firebase.database().ref('class/'
            + class_name
            + '/prenotation/'
            + prn_date.getDate() + "-"
            + (prn_date.getMonth() + 1) + '-'
            + prn_date.getFullYear() + '/').once('value', snap => {
                snap.forEach(childSnap => {
                    occupied_h.push(childSnap.key);
                    occupied_cls.push(childSnap.val());
                });
            }).then(() => {
                $("#class_pren_body").empty();

                for (var hour = 8; hour<25; hour++) {

                    idx = occupied_h.indexOf(hour+"");
                    if (idx != -1) {
                        class_info = occupied_cls[idx];
                    } else {
                        class_info = "";
                    }

                    $("#class_pren_body").append(
                    '<tr>'+
                    '<th>'+SPECIAL_HOURS[hour]+'</th><td>'+ class_info +'</td>'+
                    '</tr>');
                }
            });

            firebase.database().ref('class/' + class_name +'/event/').once('value', snap => {
                $("#prenotations_list").empty();
                var today_date = prn_date.getDate() + "-" + (prn_date.getMonth() + 1) + '-'+ prn_date.getFullYear();
                snap.forEach(childSnap => {
                    if (childSnap.val().date == today_date) {
                        var event_title = childSnap.val().title;
                        var event_description = childSnap.val().description;
                        $("#prenotations_list").append('<li class="list-group-item">La classe partecipa all\'evento: ' + 
                        event_title+ '</li>');
                    }
                });
            });
        }
    });
});