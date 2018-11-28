var cleanDB = {
    today : new Date(),
    removeOldPrenotations : function () {
        firebase.database().ref('prenotation/').once('value', snap => {
            snap.forEach(childSnap => {
                if (parseInt(childSnap.key) < this.today.getFullYear()) {
                    firebase.database().ref('prenotation/'+childSnap.key).remove();
                } else if (parseInt(childSnap.key) == this.today.getFullYear()){
                    firebase.database().ref('prenotation/'+childSnap.key).once('value' , gcSnap => {
                        gcSnap.forEach(_2gcSnap => {
                            if (parseInt(_2gcSnap.key) < this.today.getMonth() + 1) {
                                firebase.database().ref('prenotation/'+childSnap.key + '/' + _2gcSnap.key).remove();
                            } else if (parseInt(_2gcSnap.key) == this.today.getMonth() + 1) {
                                firebase.database().ref('prenotation/'+childSnap.key + '/' + _2gcSnap.key).once('value', _3gcSnap => {
                                    _3gcSnap.forEach(_4gcSnap => {
                                        if (parseInt(_4gcSnap.key) < this.today.getDate()) {
                                            firebase.database().ref('prenotation/'+childSnap.key + '/' + _2gcSnap.key + '/' + _4gcSnap.key).remove();
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            });
        });

        firebase.database().ref('class/').once('value', snap => {
            snap.forEach(childSnap => {
                childSnap.forEach(gcSnap => {
                    if (gcSnap.key == 'prenotation') {
                        gcSnap.forEach(ggcSnap => {
                            var prenotationDate = cleanDB.parseDate(ggcSnap.key);
                            if (prenotationDate <  this.today) {
                                firebase.database().ref(snap.key+'/'+childSnap.key+'/'+gcSnap.key+'/'+ggcSnap.key).remove();
                            }
                        });
                    }
                });
            });
        });
    },

    parseDate : function (date) {
        var fields = date.split('-');
        return new Date(fields[0], fields[1] - 1, fields[2]);
    }
}