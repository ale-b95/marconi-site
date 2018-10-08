$(function () {
    var class_name;
    var sc_date;

    jQuery('#datetimepicker2').datetimepicker();
    jQuery('#datetimepicker2').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    $('#datetimepicker2, #select_class_pren').on('change', () => {
        sc_date = $("#datetimepicker1").datetimepicker('getValue');
        if (classroom_name != 'Seleziona aula') {
            class_name = $("#select_class_pren").find(':selected').text();

            occupied_h = [];
            occupied_cr = [];
    
            firebase.database().ref('class/'
            +class_name
            +'/prenotation/'
            +sc_date.getDate()+"-"
            +(sc_date.getMonth() + 1)+'-'
            +sc_date.getFullYear()+'/').once('value', snap => {
                snap.forEach(childSnap => {
                    occupied_h.push(childSnap.key);
                    occupied_cr.push(childSnap.val());
                });
            }).then(() => {
                $("#class_pren_body").empty();

                for (var hour = 8; hour<25; hour++) {
                    $("#class_pren_body").append(
                    '<tr class="clickable-row" id="hid_'+hour+'" value="'+hour+'">'+
                    '<th>'+hour+':00</th><td>'+ class_info +'</td>'+
                    '</tr>');
                }
            });
        }
    });
});