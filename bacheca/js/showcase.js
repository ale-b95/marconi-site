$(function() {
    var Showcase = {
        showDate : function () {
            var date = new Date();
            $('#bacheca_date').text(date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear());
        },

        showcaseAutoScroll : function () {
            var STATE = {MORNING : 0, AFTERNOON : 1, SHOWCASE : 2}
            var date = new Date();
            var morning_hours = ['bt_hid_8', 'bt_hid_9','bt_hid_10','bt_hid_11','bt_hid_12','bt_hid_13','bt_hid_14'];
            var afternoon_hours = ['bt_hid_15','bt_hid_16','bt_hid_17','bt_hid_18','bt_hid_19','bt_hid_20','bt_hid_21'];
            //prepare elements to show first
            for (id in afternoon_hours) {
                $('#'+afternoon_hours[id]).fadeOut();
            }
            setTimeout(() => {
                for (id in morning_hours) {
                    $('#'+morning_hours[id]).fadeIn();
                }
            }, 500);

            var SHOW = STATE.MORNING;
            //start cycling the elements
            INTERVAL = setInterval(function () {
                date = new Date();
                $('#bacheca_date').text(date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear());
                switch (SHOW) {
                    case STATE.MORNING:
                        $('#showcase').fadeOut();
                        setTimeout(() => {
                            $('#big-table').fadeIn();
                            for (id in morning_hours) {
                                $('#'+morning_hours[id]).fadeIn();
                            }
                        }, 500);
                        SHOW = STATE.AFTERNOON;
                    break;
                    case STATE.AFTERNOON:
                        for (id in morning_hours) {
                            $('#'+morning_hours[id]).fadeOut();
                        }
                        setTimeout(() => {
                            for (id in afternoon_hours) {
                                $('#'+afternoon_hours[id]).fadeIn();
                            }
                        }, 500);
                        SHOW = STATE.SHOWCASE;
                    break;
                    case STATE.SHOWCASE:
                        $('#big-table').fadeOut();
                        for (id in afternoon_hours) {
                            $('#'+afternoon_hours[id]).fadeOut();
                        }
                        setTimeout(() => {
                            $('#showcase').fadeIn();
                        }, 500);
                        SHOW = STATE.MORNING;
                    default:
                }
            }, 10000);
        },

        clearShowcase : function () {
            for (i = 1; i <= 10; i++) {
                $('#th_'+ i).empty();
            }

            for (i = 8; i < 22; i++) {
                for (j = 0; j < 10 ; j++) {
                    $('#cll_'+ i + '_' + j).empty();
                    $('#cll_'+ i + '_' + j).removeClass('reserved_lesson');
                    $('#cll_'+ i + '_' + j).removeClass('reserved_event');   
                }
            }
        },

        updateShowcase : function (date = new Date()) {
            firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').onUpdate(() => {
                clearShowcase();
                loadShowcase(date);
            });

            firebase.database().ref('date/').onUpdate(() => {
                clearShowcase();
                loadShowcase(date);
                loadShowcase(date);
            })
        },

        loadShowcase : function (date = new Date()) {
            var selected_croom = [];
            var croom_w_prenotation = [];
            var other_croom = [];

            var external_events = [];

            var bacheca_croom = [];

            var promises = [];

            var dateString = date.getFullYear()+'-'+(date.getMonth() + 1)+'-'+date.getDate();
            //1) cerca tra le date del giorno quelle che non sono  interne
            var myProm_00 = firebase.database().ref('date/'+dateString+'/').once('value', eventDate => {
                //if place is external
                eventDate.forEach(e => {
                    if (e.val()) {
                        firebase.database().ref('event/'+eventDate.key).once('value', ext_event=> {
                            ext_event.forEach(child => {
                                console.log(child.key);
                            });
                            /*extEv = {
                                title : event.val().title,
                                hour : event.child('/date/'+dateString+'hour').val(),
                                place : event.child('/date/'+dateString+'/place/name').val()
                            };
                            console.log(extEv)
                            external_events.push(extEv);*/
                        });
                    }
                })
                
            });

            //2) vai all'evento corrispondente prendi l'orario e il luogo e facci una colonna

            // first select all favourite classrooms
            var myProm_01 = firebase.database().ref('classroom/').once('value', snap => {
                snap.forEach(childSnap => {
                    if (childSnap.val().isFavourite) {
                        if (!selected_croom.includes(childSnap.key)) {
                            selected_croom.push(childSnap.key);
                        }
                    } else {
                        if (!other_croom.includes(childSnap.key)) {
                            other_croom.push(childSnap.key);
                        }
                    }
                });
            });

            // then the once where there is a prenotation for the selected day
            var myProm_02 = firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').once('value', snap => {
                snap.forEach(childSnap => {
                    if (!croom_w_prenotation.includes(childSnap.key)) {
                        croom_w_prenotation.push(childSnap.key);
                    }
                });
            });

            promises.push(myProm_00);
            promises.push(myProm_01);
            promises.push(myProm_02);

            Promise.all(promises).then(() => {
                //first add classrooms selected which have prenotations
                for (i in selected_croom) {
                    if (croom_w_prenotation.includes(selected_croom[i])) {
                        bacheca_croom.push(selected_croom[i]);
                    }
                }

                //then add other classrooms with prenotations
                for (i in croom_w_prenotation) {
                    if (!bacheca_croom.includes(croom_w_prenotation[i])) {
                        bacheca_croom.push(croom_w_prenotation[i]);
                    }
                }

                //then add all remaining selected classrooms
                for (i in selected_croom) {
                    if (!bacheca_croom.includes(selected_croom[i])) {
                        bacheca_croom.push(selected_croom[i]);
                    }
                }

                for (i in other_croom) {
                    if (!bacheca_croom.includes(other_croom[i])) {
                        bacheca_croom.push(other_croom[i]);
                    }
                }
                
                for (i in bacheca_croom) {
                    var idx = parseInt(i) + 1;
                    this.fillShowcase(croom_w_prenotation, bacheca_croom[i], idx);
                }
            });
        },

        fillShowcase : function (classrooms_with_prenotation, classroom_name, idx) {
            if (classrooms_with_prenotation.includes(classroom_name)) {
                var date = new Date();
                //for each selected classroom prints on the big table the corresponding schedule
                firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/'+classroom_name+'/').once('value', snap => {
                    snap.forEach(childSnap => {
                        var index = idx + 1;
                        var hour = childSnap.key;
                        var event_title = childSnap.val().event;
                        var text;

                        if (event_title) {
                            text = event_title;
                        } else {
                            text = childSnap.val().class_name + ' ' + childSnap.val().teacher;
                        }

                        $("#th_"+idx).text(childSnap.val().classroom);
                        $("#bt_hid_"+hour+" td:nth-child("+index+")").text(text);
                        if (event_title) {
                            $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_event'); 
                            $("#bt_hid_"+hour+" td:nth-child("+index+")").removeClass('reserved_lesson');          
                        } else {
                            $("#bt_hid_"+hour+" td:nth-child("+index+")").addClass('reserved_lesson');
                            $("#bt_hid_"+hour+" td:nth-child("+index+")").removeClass('reserved_event'); 
                        }
                    });
                });
            } else {
                firebase.database().ref('classroom/'+classroom_name).once('value', snap => {
                    $("#th_"+idx).text(snap.val().name);
                });
            }
        },

        loadEventShowcase : function () {
            var now = new Date();
            var first_hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            var last_hour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            firebase.database().ref('announcement/').on('value', snap => {
                $('.announcement-show').remove();
                snap.forEach(childSnap => {
                    if (childSnap.val().startDate <= last_hour.getTime() && childSnap.val().startDate >= first_hour.getTime()) {
                        $('#showcase').append('<div class="jumbotron announcement-show">'+
                            '<h1 class="h3 mb-3 font-weight-normal">Avviso: '+ childSnap.val().title +'</h1>'+
                            '<p>'+ childSnap.val().description + '</p></div>');
                    }
                });
            });

            firebase.database().ref('event/').orderByChild("date").startAt(first_hour.getTime()).endAt(last_hour.getTime()).on("value", snap => {
                $('.event-show').remove();
                snap.forEach(childSnap => {
                    $('#showcase').append('<div class="jumbotron event-show">'+
                        '<h1 class="h3 mb-3 font-weight-normal">Evento: '+ childSnap.val().title +'</h1>'+
                        '<p>'+ childSnap.val().description + '</p></div>');
                });
            });
        }
    }

    Showcase.loadShowcase();
    Showcase.showDate();
    //Showcase.showcaseAutoScroll();
    Showcase.loadEventShowcase();
});

