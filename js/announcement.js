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
            $('#announcement_datepicker').slideDown();
    
            if ($('#select_announcement_action').val() == 0) {
                $('#create_announcement').slideDown();
                $('#remove_announcement').slideUp();
            } else {
                $('#remove_announcement').slideDown();
                $('#create_announcement').slideUp();
                this.fillAnnouncementSelectList();
            }
        });
    
        $('#datetimepicker7, #datetimepicker8').on('change', () => {
            this.fillAnnouncementSelectList();
        });
    
        $('#announcement_back_btn').on('click', () => {
            this.announcement_done();
        });
    
        $('#send_announcement').on('click', () => {
            this.writeAnnouncement();
            
        });
    
        $('#delete_announcement').on('click', snap => {
            this.deleteAnnouncement();
        });
    },

    fillAnnouncementSelectList : function () {
        $('#announcement_select').empty();
        $('#announcement_select').append('<option value="" disabled selected>Seleziona avviso</option>');
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
    
        if (announcement_title != '' && announcement_desc != '' && startDate.getTime() > yesterday.getTime() && endDate.getTime() > startDate.getTime()) {
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
            if ($('#announcement_title').val() != '') error_msg += 'Inserisci un titolo per l\'avviso\n';
            if ($('#announcement_desc').val() != '') error_msg += 'Inserisci una descrizione per l\'avviso\n';
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
        $('#create_announcement').hide();
        $('#remove_announcement').hide();
        $('#announcement_datepicker').hide();
        Admin.resetForms();
        showPage($("#administration_page"));
    }
}

