var AdvancedOperations = {
    proto_week_selection : null,
    user_name : null,
    user_key : null,
    selected_class : [],
    newEventClassSelection : new CheckboxClassSelectDropdown("adv_new_event_dropdown"),

    init : function () {
        
        this.proto_week_selection = {
            selected_rows : 0,
            selected_hours : [[],[],[],[],[],[],[]]
        };
        
        DataFormFillUtility.createDayScheduleTable('advanced_schedule_table_body', this.proto_week_selection);
        $('#adv_prenotation_btn').on('click', () => {
            this.setupAdvancedOperations();
        });

        $("#advanced_schedule_table_body").on('click', '.clickable-row', function(event) {
            var day = $('#adv_select_day').val();
            if ($(this).hasClass('d-'+day)) {
                var s_hour = parseInt($(this).attr('value'));
                if ($(this).hasClass('selected_row')) {
                    $(this).removeClass('selected_row');
                    AdvancedOperations.proto_week_selection.selected_rows--;
                    var idx = AdvancedOperations.proto_week_selection.selected_hours[day].indexOf(s_hour);
                    if (idx >= 0) AdvancedOperations.proto_week_selection.selected_hours[day].splice(idx, 1);
                } else {
                    $(this).addClass('selected_row');
                    AdvancedOperations.proto_week_selection.selected_hours[day].push(s_hour);
                    AdvancedOperations.proto_week_selection.selected_rows++;
                }
            }
        });
    
        $('#adv_user_select').on('change', () => {
            user_key = $('#adv_user_select').val();
            if (user_key != null) {
                firebase.database().ref('user/'+user_key).once('value',snap => {
                    AdvancedOperations.user_name = snap.val().name + ' ' + snap.val().surname;
                });
            }
        });
    
        jQuery('#datetimepicker4').datetimepicker({
            minDate:'0',
            timepicker:false,
            format:'d.m.Y'
        });
    
        jQuery('#datetimepicker5').datetimepicker({
            minDate:'0',
            timepicker:false,
            format:'d.m.Y'
        });
    
        $('#select_adv_prenotation').on('change', () => {
            $('#proto_week_selection').slideDown();
            $('#adv_datepicker').slideDown();
            AdvancedOperations.selected_class = [];
    
            if ($('#select_adv_prenotation').val() == 0) {
                $('#advanced_croom_prenotation').slideDown();
                $('#advanced_event_creation').slideUp();
            } else {
                $('#advanced_event_creation').slideDown();
                $('#advanced_croom_prenotation').slideUp();
                AdvancedOperations.newEventClassSelection.loadClasses(null);
            }
        });
    
        $('#adv_prenotation_back_btn').on('click', () => {
            this.advancedOperationDone();
        });
    
        $('#select_adv_prenotation').on('change', () => {
            switch ($('#select_adv_prenotation').val()) {
                case '0': //classroom prenotation
                    DataFormFillUtility.loadClassroomSelectList('adv_croom_select');
                    DataFormFillUtility.loadClassSelectList('adv_class_select');
                    DataFormFillUtility.loadUserSelectList('adv_user_select');
                    break;
                case '1': //event organizzation
                    DataFormFillUtility.loadClassroomSelectList('adv_event_croom_select');
                    break;
                default:
                    break;
            }
        });
    
        $('#adv_select_day').on('change', () => {
            DataFormFillUtility.loadDayScheduleTable('advanced_schedule_table_body', this.proto_week_selection, parseInt($('#adv_select_day').val()));
            $('#advanced_schedule_table').slideDown();
        }); 
    },

    setupAdvancedOperations : function() {
        var prenotation_ok = false;
        if ($('#select_adv_prenotation').val() != null) {
            var first_day = $("#datetimepicker4").datetimepicker('getValue');
            var last_day = $("#datetimepicker5").datetimepicker('getValue');

            if (first_day == null) {
                first_day = new Date();
            }

            if (last_day == null) {
                last_day = new Date();
            }
            switch (parseInt($('#select_adv_prenotation').val())) {
                case 0:
                    if (this.wellFilledForm('adv_croom_select') && this.wellFilledForm('adv_class_select')) {
                        prenotation_ok = true;
                    } else {
                        var error_msg = "";

                        if (!wellFilledForm('adv_croom_select')) {
                            error_msg += 'Seleziona un\'aula.\n';
                        }

                        if (!this.wellFilledForm('adv_class_select')) {
                            error_msg += 'Seleziona una classe.\n';
                        }

                        alert(error_msg);
                        prenotation_ok = false;
                    }
                break;
                
                case 1:
                    if (this.wellFilledForm('adv_event_title') && this.wellFilledForm('adv_e_desc' )&& this.wellFilledForm('adv_event_croom_select')) {
                        prenotation_ok = true;
                    } else {
                        var error_msg = "";

                        if (!this.wellFilledForm('adv_event_title')) {
                            error_msg += 'Inserisci un titolo per l\'evento.\n';
                        }

                        if (!this.wellFilledForm('adv_e_desc')) {
                            error_msg += 'Inserisci una descrizione per l\'evento.\n';
                        }

                        if (!this.wellFilledForm('adv_event_croom_select')) {
                            error_msg += 'Seleziona un\'aula per l\'evento.\n';
                        }

                        alert(error_msg);
                        prenotation_ok = false;
                    }
                break;

                default:
                ;
            }

            if (prenotation_ok) {
                if (!this.proto_week_selection.selected_rows > 0) {
                    console.log('ERRORE: ' + this.proto_week_selection.selected_rows);
                    alert('Seleziona l\'orario per la prenotazione');
                    prenotation_ok = false;
                }
            }
        } else {
            alert('Seleziona la modalità di prenotazione.')
        }

        if (prenotation_ok) {
            if ((AdvancedOperations.user_name == null) || (AdvancedOperations.user_key == null)) {
                var user = firebase.auth().currentUser;
                user_name = user.displayName;
                user_key = user.uid;
            }

            var teacher_name = AdvancedOperations.user_name;
            var teacher_key = AdvancedOperations.user_key;
            var temp_date = first_day;
            
            switch (parseInt($('#select_adv_prenotation').val())) {
                case 0:
                    var selected_classroom_name = $('#adv_croom_select').find(':selected').text();
                    var selected_classroom_key = $('#adv_croom_select').val();
                    var selected_class = $('#adv_class_select').val();
                    while (temp_date <= last_day) {
                        this.makePrenotation(teacher_key, teacher_name, selected_classroom_name, selected_classroom_key, selected_class, temp_date.getTime(), this.proto_week_selection);
                        temp_date.setDate(temp_date.getDate() + 1);
                    }
                break;
                case 1:
                    var selected_classroom_name = $('#adv_event_croom_select').find(':selected').text();
                    var selected_classroom_key = $('#adv_event_croom_select').val();
                    var title = $('#adv_event_title').val();
                    var desc = $('#adv_e_desc').val();

                    var event_key = this.createEvent(teacher_key, teacher_name, title, selected_classroom_name, selected_classroom_key, desc, temp_date);
                    var cnt = 0;
                    while (temp_date <= last_day) {
                        var datename = 'date-' + cnt;
                        firebase.database().ref('event/'+event_key+'/period').update({
                            [datename] : temp_date.getTime()
                        });
                        this.eventPrenotation(title, event_key, selected_classroom_name, selected_classroom_key, temp_date, this.proto_week_selection);
                        temp_date.setDate(temp_date.getDate() + 1);
                        cnt++;
                    }
                break;
                default:
            }

            this.advancedOperationDone();
        } else {
            console.log('ERRORE: prenotazione non eseguita');
        }
    },

    makePrenotation : function (teacher_key, teacher_name, selected_classroom_name, selected_classroom_key, selected_class, date, week_schedule) {
        var temp_date = new Date(date);
        var tmp_day = temp_date.getDate();
        var tmp_month = temp_date.getMonth() + 1;
        var tmp_year = temp_date.getFullYear();
        var day = temp_date.getDay() - 1;
        if (day < 0) day = 6;

        var promises_select = [];
        var promise_remove = [];

        var toRemove = {class_name:[], hour:[]};
        for (i in week_schedule.selected_hours[day]) {
            var hour = week_schedule.selected_hours[day][i];
            var my_prom = firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour).once('value', function(snap)  {
                if (snap.exists()) {
                    toRemove.class_name.push(snap.val().class);
                    toRemove.hour.push(this.h);
                }
            }.bind({h : hour}));
            promises_select.push(my_prom);
        }

        Promise.all(promises_select).then(() => {
            for (i in week_schedule.selected_hours[day]) {
                var my_prom = firebase.database().ref('class/'+toRemove.class_name[i]+'/prenotation/'+tmp_day+"-"+tmp_month+'-'+tmp_year+'/'+toRemove.hour[i]+'/').remove();
                promise_remove.push(my_prom);
            }

            Promise.all(promise_remove).then(() => {
                for (i in week_schedule.selected_hours[day]){
                    var hour = week_schedule.selected_hours[day][i];
                    firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour+'/').set({
                        class : selected_class,
                        classroom : selected_classroom_name,
                        teacher : teacher_name,
                        teacher_key : teacher_key
                    });
                    firebase.database().ref('class/'+selected_class+'/prenotation/'+tmp_day+"-"+tmp_month+'-'+tmp_year+'/').update({
                        [hour] : selected_classroom_name
                    });
                }
            });
        });
    },

    eventPrenotation : function (title, e_key, selected_classroom_name, selected_classroom_key, temp_date, week_schedule) {
        var tmp_day = temp_date.getDate();
        var tmp_month = temp_date.getMonth() + 1;
        var tmp_year = temp_date.getFullYear();
        var day = temp_date.getDay() - 1;
        if (day < 0) day = 6;

        var promises_select = [];
        var promise_remove = [];

        var toRemove = {class_name:[], hour:[]};
        for (i in week_schedule.selected_hours[day]) {
            var hour = week_schedule.selected_hours[day][i];
            var my_prom = firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour).once('value', function(snap)  {
                if (snap.exists()) {
                    toRemove.class_name.push(snap.val().class);
                    toRemove.hour.push(this.h);
                }
            }.bind({h : hour}));
            promises_select.push(my_prom);
        }

        Promise.all(promises_select).then(() => {
            for (i in week_schedule.selected_hours[day]) {
                var my_prom = firebase.database().ref('class/'+toRemove.class_name[i]+'/prenotation/'+tmp_day+"-"+tmp_month+'-'+tmp_year+'/'+toRemove.hour[i]+'/').remove();
                promise_remove.push(my_prom);
            }

            Promise.all(promise_remove).then(() => {
                for (i in week_schedule.selected_hours[day]){
                    var hour = week_schedule.selected_hours[day][i];
                    firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour+'/').set({
                        classroom : selected_classroom_name,
                        event_key : e_key,
                        event : title,
                    });
                }
            });
        });
    },

    createEvent : function(t_key, t_name, title, croom_name, croom_key, description, date) {
        
        var r_date = date.getDate() + '-' + (date.getMonth()+1) + '-' + date.getFullYear();
        var event = firebase.database().ref().child('event/').push({
            title : title,
            classroom : croom_name,
            classroom_key : croom_key,
            date : date.getTime(),
            teacher : t_name,
            teacher_key : t_key,
            description : description,
            readable_date : r_date
        });

        AdvancedOperations.newEventClassSelection.applySelection(event.key, AdvancedOperations.selected_class);
        return event.key;
    },

    wellFilledForm : function(form) {
        return ($('#'+form).val() != null);
    },

    advancedOperationDone : function() {
        $(".d-row").removeClass('selected_row');
        $('#proto_week_selection').slideUp();
        $('#advanced_event_creation').slideUp();
        $('#advanced_croom_prenotation').slideUp();
        $('#adv_datepicker').slideUp();
        $('#advanced_schedule_table').slideUp();
        showPage($("#administration_page"));

        Admin.resetForms();
        this.proto_week_selection = {
            selected_rows : 0,
            selected_hours : [[],[],[],[],[],[],[]]
        }
    }
}