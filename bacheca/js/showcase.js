class ShowcaseElement {
    constructor(idx, element_id, type) {
        this.idx = idx;
        this.type = type
        this.element_id = element_id;
    }

    showElement(date) {
        if (this.type == 'CLASSROOM') {
            firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/'+this.element_id+'/').once('value', snap => {
                snap.forEach(childSnap => {
                    var hour = childSnap.key;
                    var event_title = childSnap.val().event;
                    var text;
                    if (event_title) {
                        text = event_title;
                    } else {
                        text = childSnap.val().class_name + ' ' + childSnap.val().teacher;
                    }
                    $("#th_"+this.idx).text(childSnap.val().classroom);
                    $("#cll_"+hour+"_"+this.idx).text(text);
                    if (event_title) {
                        $("#cll_"+hour+"_"+this.idx).addClass('reserved_event'); 
                        $("#cll_"+hour+"_"+this.idx).removeClass('reserved_lesson');          
                    } else {
                        $("#cll_"+hour+"_"+this.idx).addClass('reserved_lesson');
                        $("#cll_"+hour+"_"+this.idx).removeClass('reserved_event'); 
                    }
                });
            });
        } else if (this.type == 'EVENT'){
            var dateString = date.getFullYear()+'-'+(date.getMonth() + 1)+'-'+date.getDate();

            firebase.database().ref('event/'+this.element_id).once('value', event=> {
                $("#th_"+(this.idx)).text(event.child('/date/'+dateString+'/place/name').val());
                event.child('/date/'+dateString+'/hour').val().forEach(hour => {
                    $("#cll_"+hour+"_"+this.idx).text(event.val().title);
                    $("#cll_"+hour+"_"+this.idx).addClass('reserved_event');
                });
            });
        }
    }

    setTableHeader() {
        firebase.database().ref('classroom/'+this.element_id).once('value', classroom => {
            $("#th_"+this.idx).text(classroom.val().name);
        })
    }
}

class Announcement {
    constructor (title, description, id, type) {
        this.title = title;
        this.description = description;
        this.id = id;
        this.type = type;
    }
}

$(function() {
    var eventsToShow = 0;
    var announcementsToShow = 0;

    var Showcase = {
        globalDate : new Date(),

        init : function () {
            this.announcementList = [];
            this.eventList = [];
        },

        showDate : function (date = Showcase.globalDate) {
            $('#bacheca_date').text(date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear());
        },

        showcaseAutoScroll : function (date = Showcase.globalDate) {
            var STATE = {MORNING : 0, AFTERNOON : 1, SHOWCASE : 2}
            var morning_hours = ['bt_hid_8', 'bt_hid_9','bt_hid_10','bt_hid_11','bt_hid_12','bt_hid_13'];
            var afternoon_hours = ['bt_hid_14','bt_hid_15','bt_hid_16','bt_hid_17','bt_hid_18','bt_hid_19','bt_hid_20','bt_hid_21'];
            //prepare elements to show first
            for (id in afternoon_hours) {
                $('#'+afternoon_hours[id]).fadeOut();
            }
            setTimeout(() => {
                for (id in morning_hours) {
                    $('#'+morning_hours[id]).fadeIn();
                }
            }, 300);

            
            var SHOW = STATE.MORNING;
            //start cycling the elements
            INTERVAL = setInterval(function () {
                date = Showcase.globalDate;
                $('#bacheca_date').text(date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear());
                switch (SHOW) {
                    case STATE.MORNING:
                        $('#showcase').fadeOut();
                        for (id in afternoon_hours) {
                            $('#'+afternoon_hours[id]).fadeOut();
                        }
                        setTimeout(() => {
                            $('#big-table').fadeIn();
                            for (id in morning_hours) {
                                $('#'+morning_hours[id]).fadeIn();
                            }
                        }, 300);
                        SHOW = STATE.AFTERNOON;
                    break;
                    case STATE.AFTERNOON:
                        $('#showcase').fadeOut();
                        for (id in morning_hours) {
                            $('#'+morning_hours[id]).fadeOut();
                        }
                        setTimeout(() => {
                            for (id in afternoon_hours) {
                                $('#'+afternoon_hours[id]).fadeIn();
                            }
                        }, 300);

                        announcementsToShow = Showcase.announcementList.length;
                        eventsToShow = $('.ev').length;
                        console.log("events: " + eventsToShow);
                        console.log("announcements: " + announcementsToShow);
                        if (eventsToShow > 0 || announcementsToShow > 0) {
                            SHOW = STATE.SHOWCASE;
                        } else {
                            SHOW = STATE.MORNING;;
                        }
                        
                    break;
                    case STATE.SHOWCASE:
                        $('#big-table').fadeOut();
                        for (id in afternoon_hours) {
                            $('#'+afternoon_hours[id]).fadeOut();
                        }
                        for (id in morning_hours) {
                            $('#'+morning_hours[id]).fadeOut();
                        }
                        setTimeout(() => {
                            $('#showcase').fadeIn();
                        }, 300);
                        SHOW = STATE.MORNING;
                    default:
                }
            }, 2000);
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

        updateShowcase : function (date = Showcase.globalDate) {
            firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').on('value',() => {
                if (date == null) date = Showcase.globalDate;
                this.reloadShowcase(date);
            });
        },

        reloadShowcase : function (date = Showcase.globalDate) {
            Showcase.clearShowcase();
            Showcase.loadShowcase(date);
        },

        loadShowcase : function (date = Showcase.globalDate) {
            console.log('load showcase');
            var favourite_classrooms = [];
            var other_classrooms = [];
            var prenotated_classrooms = [];

            var external_events = [];

            var promises = [];
            var dateString = date.getFullYear()+'-'+(date.getMonth() + 1)+'-'+date.getDate();
            var myProm_00 = firebase.database().ref('date/'+dateString+'/').once('value', eventDate => {
                //if place is external
                eventDate.forEach(e => {
                    if (!e.val()) {
                        external_events.push(e.key);
                    }
                })
            });

            // first select all favourite classrooms
            var myProm_01 = firebase.database().ref('classroom/').once('value', snap => {
                snap.forEach(childSnap => {
                    if (childSnap.val().isFavourite) {
                        if (!favourite_classrooms.includes(childSnap.key)) {
                            favourite_classrooms.push(childSnap.key);
                        }
                    } else {
                        if (!other_classrooms.includes(childSnap.key)) {
                            other_classrooms.push(childSnap.key);
                        }
                    }
                });
            });

            // then the once where there is a prenotation for the selected day
            var myProm_02 = firebase.database().ref('prenotation/'+date.getFullYear()+'/'+(date.getMonth() + 1)+'/'+date.getDate()+'/').once('value', snap => {
                snap.forEach(childSnap => {
                    var classroom_id = childSnap.key;
                    if (!prenotated_classrooms.includes(classroom_id)) {
                        prenotated_classrooms.push(classroom_id);
                    }
                });
            });

            promises.push(myProm_00);
            promises.push(myProm_01);
            promises.push(myProm_02);

            Promise.all(promises).then(() => {
                var classrooms = favourite_classrooms;
                classrooms = classrooms.concat(other_classrooms);

                prenotated_classrooms.forEach(e => {
                    if (classrooms.includes(e)) {
                        var idx = classrooms.indexOf(e);
                        classrooms.splice(idx, 1);
                    }
                });

                var showcaseElements = [];

                var i = 0;
                prenotated_classrooms.forEach(e => {
                    showcaseElements.push(new ShowcaseElement(i, e, 'CLASSROOM'));
                    i++;
                });

                external_events.forEach((e) => {
                    showcaseElements.push(new ShowcaseElement(i, e, 'EVENT'));
                    i++
                });

                classrooms.forEach((e) => {
                    if (i < 10) {
                        var header = new ShowcaseElement(i, e, 'CLASSROOM');
                        header.setTableHeader();
                        i++
                    }
                });
                
                showcaseElements.forEach(e => {
                    if (e.idx < 11) {
                        e.showElement(date);
                    }
                });
            });
        },

        loadEventShowcase : function () {            
            firebase.database().ref('announcement/').on('value', () => {
                this.updateAnnouncementList();
            });
            
            var dateString = Showcase.globalDate.getFullYear()+'-'+(Showcase.globalDate.getMonth() + 1)+'-'+Showcase.globalDate.getDate();

            firebase.database().ref('date/'+dateString+'/').on('value', (date) => {
                console.log("date modificato");
                this.eventList = [];
                $('.ev').remove();
                date.forEach(event => {
                    this.updateEventList(event.key);
                });
            });
        },

        updateAnnouncementOnDashboard() {
            $('.ann').remove();
            this.announcementList.forEach((announcement, i) => {
                var row = 'null';

                if (i < 4) {
                    row = 'first_row';
                } else if (i >= 4 && i < 8) {
                    row = 'second_row';
                }

                $('#'+row).append('<div class="col-3 ann" id="ann_'+announcement.id+'">'+
                    '<div class="jumbotron">'+
                        '<h1 class="h4 mb-4 font-weight-normal">Avviso: '+announcement.title+'</h1>'+
                        '<p">'+announcement.description+'</p>'+
                    '</div>'+
                '</div>');
            });
        },

        updateEventList(eventKey) {
            firebase.database().ref('event/'+eventKey+'/').on('value', event => {
                $("#ann_"+eventKey).remove();
                if (event.val().onShowcase) {
                    var i = $('.ev').length;

                    if (i < 4) {
                        row = 'first_row';
                    } else if (i >= 4 && i < 8) {
                        row = 'second_row';
                    }
    
                    $('#'+row).append('<div class="col-3 ev" id="ann_'+eventKey+'">'+
                        '<div class="jumbotron">'+
                            '<h1 class="h4 mb-4 font-weight-normal">Evento: '+event.val().title+'</h1>'+
                            '<p">'+event.val().description+'</p>'+
                        '</div>'+
                    '</div>');
                }
            });
        }, 

        updateAnnouncementList(date = Showcase.globalDate) {
            this.announcementList = [];
            var first_hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            var last_hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
            var myprom = firebase.database().ref('announcement/').once('value', announcements => {
                announcements.forEach(announcement => {
                    if (announcement.val().startDate <= last_hour.getTime() && announcement.val().startDate >= first_hour.getTime()) {
                        this.announcementList.push(new Announcement(announcement.val().title, announcement.val().description, announcement.key, announcement.val().type));
                    }
                });
            });

            myprom.then(() => {
                this.updateAnnouncementOnDashboard();
            });
        }
    }

    Showcase.init();
    Showcase.updateShowcase();
    Showcase.showDate();
    Showcase.showcaseAutoScroll();

    Showcase.loadEventShowcase();

    //ottieni eventi

    //ottieni avvisi

    //aggiorna eventi

    //aggiorna avvisi
    
    $('#datetimepicker').on('change', () => {
        Showcase.globalDate = $('#datetimepicker').datetimepicker('getValue');
        Showcase.updateShowcase(Showcase.globalDate);
        Showcase.showDate(Showcase.globalDate);
        Showcase.loadEventShowcase(Showcase.globalDate);
    });
});

