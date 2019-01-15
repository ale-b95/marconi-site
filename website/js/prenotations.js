$(function () {
    var class_key;
    var prn_date;

    jQuery('#datetimepicker2').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#datetimepicker2, #select_class_pren').on('change', () => {
        $("#class_pren_body").empty();
        prn_date = $("#datetimepicker2").datetimepicker('getValue');
        if (classroom_name != 'Seleziona classe') {
            class_key = $("#select_class_pren").find(':selected').val();

            var occupied_h = [];
            var occupied_cls = [];
    
            firebase.database().ref('class/'
            + class_key
            + '/prenotation/'
            + prn_date.getFullYear() + "-"
            + (prn_date.getMonth() + 1) + '-'
            + prn_date.getDate() + '/').once('value', snap => {
                snap.forEach(childSnap => {
                    var place = childSnap.val();
                    if (place.split(',')[0] == "event") {
                        place = 'Partecipa all\' evento: '+place.split(',')[2];
                    }
                    occupied_h.push(childSnap.key);
                    occupied_cls.push(place);
                });
            }).then(() => {
                $("#class_pren_body").empty();

                for (var hour = 8; hour<22; hour++) {
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
        }
    });
});