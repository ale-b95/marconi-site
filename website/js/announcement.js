var Announcement = {
    init : function () {
        jQuery('#datetimepicker7').datetimepicker({
            minDate:'0',
            timepicker:false,
            format:'d.m.Y'
        });
    
        jQuery('#datetimepicker8').datetimepicker({
            minDate:'0',
            timepicker:false,
            format:'d.m.Y'
        });
    
        $('#select_announcement_action').on('change', () => {
            if ($('#select_announcement_action').val() == 0) {
                $('#create_announcement').slideDown();
                $('#remove_announcement').slideUp();
                $('#announcement_datepicker').slideDown();
            } else {
                $('#remove_announcement').slideDown();
                $('#create_announcement').slideUp();
                $('#announcement_datepicker').slideUp();
                this.fillAnnouncementSelectList(true);
            }
        });
    
        $('#datetimepicker7, #datetimepicker8').on('change', () => {
            this.fillAnnouncementSelectList(false);
        });
    
        $('#send_announcement').on('click', () => {
            if (Marconi.admin == 1) {
                this.writeAnnouncement();
            }
        });
    
        $('#delete_announcement').on('click', () => {
            if (Marconi.admin == 1) {
                this.deleteAnnouncement();
            }
        });

        $('#announcement_select').on('change', () => {
            var announcement_key = $('#announcement_select').val();
            firebase.database().ref('announcement/'+announcement_key).once('value', ann => {
                $('#ann_title').text(ann.val().title);
                $('#ann_desc').text(ann.val().description);
                $('#ann_details').show();
            }) 
        })

        $('#ann_done').on('click', () => {
            if (Marconi.admin == 1) {
                this.announcement_done();
            }
        })
    },

    fillAnnouncementSelectList : function (all) {
        $('#announcement_select').empty();
        $('#announcement_select').append('<option value="" disabled selected>Seleziona avviso</option>');
        if (all) {
            firebase.database().ref('announcement/').once('value', snap => {
                snap.forEach(childSnap => {
                    $('#announcement_select').append('<option value="'+childSnap.key+'">'+childSnap.val().title+'</option>')
                });
            });
        } else {
            var startDate = $("#datetimepicker7").datetimepicker('getValue');
            var endDate = $("#datetimepicker8").datetimepicker('getValue');
            var today = new Date();
            var yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
    
            if (startDate == null) {
                startDate = today;
            }
    
            if (endDate == null) {
                endDate = today;
            }
    
            firebase.database().ref('announcement/').once('value', snap => {
                snap.forEach(childSnap => {
                    if (childSnap.val().endDate >= startDate.getTime() && childSnap.val().startDate <= endDate.getTime()) {
                        $('#announcement_select').append('<option value="'+childSnap.key+'">'+childSnap.val().title+'</option>')
                    }
                });
            });
        }
    },

    writeAnnouncement : function () {
        var announcement_title = $('#announcement_title').val();
        var announcement_desc = $('#announcement_desc').val();

        var today = new Date();
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
    
        var startDate = $("#datetimepicker7").datetimepicker('getValue');
        var endDate = $("#datetimepicker8").datetimepicker('getValue');
    
        if (startDate == null) {
            startDate = today;
        }
    
        if (endDate == null) {
            endDate = today;
        }
    
        if (announcement_title != '' && announcement_desc != '' && startDate.getTime() >= yesterday.getTime() && endDate.getTime() >= startDate.getTime()) {
            firebase.database().ref('announcement/').push().set({
                title : announcement_title,
                description : announcement_desc,
                startDate : startDate.getTime(),
                endDate : endDate.getTime()
            }).then(() => {
                this.announcement_done();
            });
        } else {
            var error_msg = '';
            if (announcement_title == '') error_msg += 'Inserisci un titolo per l\'avviso\n';
            if (announcement_desc == '') error_msg += 'Inserisci una descrizione per l\'avviso\n';
            if (startDate.getTime() < yesterday.getTime() || endDate.getTime() < startDate.getTime()) error_msg += 'Periodo inserito non valido\n';
            alert(error_msg);
        }
    },
    
    deleteAnnouncement : function() {
        var announcement_key = $('#announcement_select').val();
        if (announcement_key != null) {
            firebase.database().ref('announcement/'+ announcement_key).remove();
            this.announcement_done();
        } else {
            alert('Seleziona un avviso da eliminare.');
        }
    },
    
    announcement_done : function() {
        $('#ann_title').text('');
        $('#ann_desc').text('');
        $('#create_announcement').hide();
        $('#remove_announcement').hide();
        $('#announcement_datepicker').hide();
        Admin.resetForms();
        //showPage($("#administration_page"));
    }
}

