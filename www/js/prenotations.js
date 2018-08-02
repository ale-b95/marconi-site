$(function () {    
    /*
        List the the event the selected class have joined
    */
    $("#prenotation_btn").on('click', () => {
        $("#prenotations_list").empty();
        if ($("#select_prenotations").find(':selected').text() != "Seleziona classe") {
            var class_name = $("#select_prenotations").find(':selected').text();
            var ref = firebase.database().ref('institute/'+INSTITUTE_ID+'/class/'+class_name+'/event/');
            ref.once('value', snap => {
                snap.forEach(childSnap => {
                   var check = firebase.database().ref('institute/'+INSTITUTE_ID+'/event/').child(childSnap.key).once('value', xSnap => {
                        if (xSnap.val() == null) { removeNode('institute/'+INSTITUTE_ID+'/class/'+class_name+'/event/'+childSnap.key);
                        }
                    }).then(() => {
                        var title; 
                        var date;
                        childSnap.forEach(gcSnap => {

                            if (gcSnap.key == 'title') {
                                title = gcSnap.val();
                            } else if (gcSnap.key == 'event_date') {
                                date = gcSnap.val();
                            }
                        });

                        $("#prenotations_list").append('<li class="list-group-item">'+title+ '\t\t\t'+date+'</li>');
                   });
                });
            });
        } else {
            
        }
    });
    
    function removeNode(path) {
        var ref = firebase.database().ref(path);
        ref.remove();
    }
});