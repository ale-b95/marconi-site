var AdvancedOperations = {
    selected_event : null,
    selected_classroom : null,
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
            AdvancedOperations.user_key = $("#adv_user_select option:selected").val();
            AdvancedOperations.user_name = $("#adv_user_select option:selected").text();
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
                AdvancedOperations.newEventClassSelection.loadClasses(null, null);
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
                    DataFormFillUtility.loadClassroomSelectList('adv_croom_select');
                    DataFormFillUtility.loadUserSelectList('adv_user_select');
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
                    if (this.wellFilledForm('adv_event_title') && this.wellFilledForm('adv_e_desc' )&& this.wellFilledForm('adv_croom_select')) {
                        prenotation_ok = true;
                    } else {
                        var error_msg = "";

                        if (!this.wellFilledForm('adv_event_title')) {
                            error_msg += 'Inserisci un titolo per l\'evento.\n';
                        }

                        if (!this.wellFilledForm('adv_e_desc')) {
                            error_msg += 'Inserisci una descrizione per l\'evento.\n';
                        }

                        if (!this.wellFilledForm('adv_croom_select')) {
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
                AdvancedOperations.user_name = user.displayName;
                AdvancedOperations.user_key = user.uid;
            }

            var temp_date = first_day;
            
            switch (parseInt($('#select_adv_prenotation').val())) {
                case 0: //prenotation
                    var selected_classroom_name = $('#adv_croom_select').find(':selected').text();
                    var selected_classroom_key = $('#adv_croom_select').val();
                    var selected_class = $('#adv_class_select').val();
                    var selected_class_name = $("#adv_class_select option:selected").text();
                    while (temp_date <= last_day) {
                        parameters = [AdvancedOperations.user_key, AdvancedOperations.user_name, selected_classroom_name, selected_classroom_key, selected_class, selected_class_name, temp_date.getTime(), this.proto_week_selection];
                        this.checkPrenotationCompatibility(this.proto_week_selection, temp_date, selected_classroom_key, 0, parameters)
                        temp_date.setDate(temp_date.getDate() + 1);
                    }
                break;
                case 1: //event
                    parameters = [this.proto_week_selection];
                    this.checkPrenotationCompatibility(this.proto_week_selection, temp_date, selected_classroom_key, 1, parameters);
                break;
                default:
            }
        } else {
            console.log('ERRORE: prenotazione non eseguita');
        }
    },

    checkPrenotationCompatibility : function (week_schedule, temp_date, classroom_key, prenotaionType, parameters) {
        var tmp_day = temp_date.getDate();
        var tmp_month = temp_date.getMonth() + 1;
        var tmp_year = temp_date.getFullYear();
        var day = temp_date.getDay() - 1;
        if (day < 0) day = 6;

        var promises_select = [];
        var toRemove = {class_name:[], hour:[], date:[]};

        for (i in week_schedule.selected_hours[day]) {
            var hour = week_schedule.selected_hours[day][i];
            var my_prom = firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+classroom_key+'/'+hour).once('value', function(snap)  {
                if (snap.exists()) {
                    toRemove.date.push(tmp_day+'/'+tmp_month+'/'+tmp_year);
                    toRemove.class_name.push(snap.val().class_name);
                    toRemove.hour.push(this.h);
                }
            }.bind({h : hour}));
            promises_select.push(my_prom);
        }

        Promise.all(promises_select).then(() => {
            if (toRemove.hour.length > 0) {
                var dettailTxt = "";
                for (i = 0; i < toRemove.hour.length; i++) {
                    dettailTxt += 'Giorno: ' + toRemove.date[i] + ' Ora: '+ toRemove.hour[i] + ' Classe: ' + toRemove.class_name[i] + '<br/>';
                }
                $('#overrideDetails').empty();
                $('#overrideDetails').append(dettailTxt);
                $('#prenotationOverrideAlertModal').modal('show');

                $('#abort_override_btn').on('click',() => {
                    this.advancedOperationDone();
                    showPage($("#admin_prenotation_page"));
                });

                $('#prenotation_override_btn').on('click', () => {
                    // 0 : make prenotation, 1 : event prenotation
                    if (prenotaionType == 0) {
                        this.makePrenotation(parameters[0], parameters[1], parameters[2], parameters[3], parameters[4], parameters[5], parameters[6], parameters[7]);
                    } else {
                        var selected_classroom_name = $('#adv_croom_select').find(':selected').text();
                        var selected_classroom_key = $('#adv_croom_select').val();
                        var title = $('#adv_event_title').val();
                        var desc = $('#adv_e_desc').val();
                        var first_day = temp_date;
                        var last_day = $("#datetimepicker5").datetimepicker('getValue');
                        if (last_day == null) {
                            last_day = new Date();
                        }

                        var event_key = this.createEvent(AdvancedOperations.user_key, AdvancedOperations.user_name, title, selected_classroom_name, selected_classroom_key, desc, temp_date);
                        this.eventPrenotation(title, event_key, selected_classroom_name, selected_classroom_key, temp_date, parameters[0]);
                        var cnt = 0;
                        while (first_day <= last_day) {
                            var datename = 'date-' + cnt;
                            firebase.database().ref('event/'+e_key+'/period').update({
                                [datename] : first_day.getTime()
                            });
                            first_day.setDate(first_day.getDate() + 1);
                            cnt++;
                        }                      
                    }
                });
            } else {
                if (prenotaionType == 0) {
                    this.makePrenotation(parameters[0], parameters[1], parameters[2], parameters[3], parameters[4], parameters[5], parameters[6], parameters[7]);
                } else if (prenotaionType == 1){
                    var selected_classroom_name = $('#adv_croom_select').find(':selected').text();
                    var selected_classroom_key = $('#adv_croom_select').val();
                    var title = $('#adv_event_title').val();
                    var desc = $('#adv_e_desc').val();
                    var first_day = temp_date;
                    var last_day = $("#datetimepicker5").datetimepicker('getValue');
                    if (last_day == null) {
                        last_day = new Date();
                    }

                    var event_key = this.createEvent(AdvancedOperations.user_key, AdvancedOperations.user_name, title, selected_classroom_name, selected_classroom_key, desc, temp_date);
                    this.eventPrenotation(title, event_key, selected_classroom_name, selected_classroom_key, temp_date, parameters[0]);
                    var cnt = 0;
                    while (first_day <= last_day) {
                        var datename = 'date-' + cnt;
                        firebase.database().ref('event/'+e_key+'/period').update({
                            [datename] : first_day.getTime()
                        });
                        first_day.setDate(first_day.getDate() + 1);
                        cnt++;
                    }      
                }
                this.advancedOperationDone();
            }
        });
    },

    makePrenotation : function (teacher_key, teacher_name, selected_classroom_name, selected_classroom_key, selected_class, selected_class_name, date, week_schedule) {
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
                    toRemove.class_name.push(snap.val().class_key);
                    toRemove.hour.push(this.h);
                }
            }.bind({h : hour}));
            promises_select.push(my_prom);
        }

        Promise.all(promises_select).then(() => {
            for (i in week_schedule.selected_hours[day]) {
                var my_prom = firebase.database().ref('class/'+toRemove.class_name[i]+'/prenotation/'+tmp_year+"-"+tmp_month+'-'+tmp_day+'/'+toRemove.hour[i]+'/').remove();
                promise_remove.push(my_prom);
            }

            Promise.all(promise_remove).then(() => {
                for (i in week_schedule.selected_hours[day]){
                    var hour = week_schedule.selected_hours[day][i];
                    firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour+'/').set({
                        class_key : selected_class,
                        class_name : selected_class_name,
                        classroom : selected_classroom_name,
                        teacher : teacher_name,
                        teacher_key : teacher_key
                    });
                    firebase.database().ref('class/'+selected_class+'/prenotation/'+tmp_year+"-"+tmp_month+'-'+tmp_day+'/').update({
                        [hour] : selected_classroom_name
                    });
                }
            });
            this.advancedOperationDone();
        });
    },

    eventPrenotation : function (title, e_key, selected_classroom_name, selected_classroom_key, date, week_schedule) {
        //date.setDate(date.getDate() - 1);
        var temp_date = new Date(date);
        var tmp_day = temp_date.getDate();
        var tmp_month = temp_date.getMonth() + 1;
        var tmp_year = temp_date.getFullYear();
        var day = temp_date.getDay() - 1;
        if (day < 0) day = 6;

        var promises_select = [];
        var promise_remove = [];

        var toRemove = {class_name:[], hour:[]};
        console.log(day);
        console.log(week_schedule.selected_hours);
        for (i in week_schedule.selected_hours[day]) {
            var hour = week_schedule.selected_hours[day][i];
            var my_prom = firebase.database().ref('prenotation/'+tmp_year+'/'+tmp_month+'/'+tmp_day+'/'+selected_classroom_key+'/'+hour).once('value', function(snap)  {
                if (snap.exists()) {
                    toRemove.class_name.push(snap.val().class_key);
                    toRemove.hour.push(this.h);
                }
            }.bind({h : hour}));
            promises_select.push(my_prom);
        }

        Promise.all(promises_select).then(() => {
            for (i in week_schedule.selected_hours[day]) {
                var my_prom = firebase.database().ref('class/'+toRemove.class_name[i]+'/prenotation/'+tmp_year+"-"+tmp_month+'-'+tmp_day+'/'+toRemove.hour[i]+'/').remove();
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
            this.advancedOperationDone();
        });
    },

    createEvent : function(t_key, t_name, title, croom_name, croom_key, description, temp_date) {
        var r_date = temp_date.getDate() + '-' + (temp_date.getMonth()+1) + '-' + temp_date.getFullYear();
        var event = firebase.database().ref().child('event/').push({
            title : title,
            classroom : croom_name,
            classroom_key : croom_key,
            date : temp_date.getTime(),
            bacheca : $('#check_adv_event_creation').is(':checked'),
            teacher : t_name,
            teacher_key : t_key,
            description : description,
            readable_date : r_date
        });

        AdvancedOperations.newEventClassSelection.applySelection(event.key, AdvancedOperations.selected_class);
        AdvancedOperations.selected_class = [];
        return event.key;
    },

    wellFilledForm : function(form) {
        return ($('#'+form).val() != null);
    },

    addElem : function (elem) {
        if (!this.selected_class.includes(elem)) {
            this.selected_class.push(elem);
        }
    },

    removeElem : function  (elem) {
        if (this.selected_class.includes(elem)) {
            var index = this.selected_class.indexOf(elem);
            if (index > -1) {
                this.selected_class.splice(index, 1);
            }
        }
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