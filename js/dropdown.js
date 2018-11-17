class CheckboxClassSelectDropdown {
   
    constructor (dropdownId) {
        this.dropdownId = dropdownId;

        $("#"+this.dropdownId+" button").on('click', () => {
            $("#"+this.dropdownId+" ul").slideToggle();
        });

        $(document).on('click', e => {
            var $clicked = $(e.target);
            if ($clicked.parents().attr('id') != this.dropdownId + "" &&
            !$clicked.parents().hasClass('list-group')) {
                $("#"+this.dropdownId+" ul").slideUp();
            }
        });
    }

    loadClasses (eventKey) {
        $('#'+this.dropdownId + ' div ul').empty();

        if (eventKey == null) {
            firebase.database().ref('class/').orderByChild('name').once('value', snap => {
                snap.forEach(childSnap => {
                    $('#'+this.dropdownId + ' div ul').append(
                        '<li class="list-group-item">'+
                            '<input onclick="onClickHandler(this)" type="checkbox" value="'+childSnap.key+'"/>  '+childSnap.val().name+
                        '</li>');
                });
            });
        } else {
            var checkedElements = [];
            firebase.database().ref('event/'+eventKey+'/class').once('value', snap => {
                snap.forEach(childSnap => {
                    checkedElements.push(childSnap.key);
                });
            }).then(() => {
                firebase.database().ref('class/').orderByChild('name').once('value', snap => {
                    snap.forEach(childSnap => {
                        var checked = "";
                        if (checkedElements.includes(childSnap.key)) {
                            checked = "checked"
                        }
                        $('#'+this.dropdownId + ' multiSelect').append(
                            '<li class="list-group-item">'+
                                '<input onclick="onClickHandler(this)" type="checkbox" '+checked+' value="'+childSnap.key+'"/>  '+childSnap.val().name+
                            '</li>');
                    });
                });
            });
        }
    }

    applySelection(eventKey, checkedElements) {
        checkedElements.forEach(element => {
            firebase.database().ref('class/'+element+'/name').once('value', snap => {
                var name = snap.val();
                firebase.database().ref('event/'+eventKey+'/class/').update({
                    [element] : name
                });
            });
        });

        
    }
}



