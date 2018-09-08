$(function () {    

    /*
        List the the event the selected class have joined
    */
    $("#select_prenotations").on('change', () => {
        $("#prenotations_list").empty();
        if ($("#select_prenotations").find(':selected').text() != "Seleziona classe") {
            alert('ciaone');
            var class_name = $("#select_prenotations").find(':selected').text();
            var ref = firebase.database().ref('class/'+class_name+'/event/');
            ref.once('value', snap => {
                snap.forEach(childSnap => {
                   var check = firebase.database().ref('event/').child(childSnap.key).once('value', xSnap => {
                        if (xSnap.val() == null) { removeNode('class/'+class_name+'/event/'+childSnap.key);
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
            alert('ciao');
        }
    });
    
    function removeNode(path) {
        var ref = firebase.database().ref(path);
        ref.remove();
    }
});