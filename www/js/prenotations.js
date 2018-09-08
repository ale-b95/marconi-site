$(function () {    
    /*
        List the the event the selected class have joined
    */
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
});