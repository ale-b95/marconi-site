class InstituteEvent {
    constructor() {
        this.id = null;
        this.title = null;
        this.description = null;
        this.organizer = null;
        this.date = [];
        this.onShowcase = false;
    }

    setId(id) {
        this.id = id;
    }

    setTitle(title) {
        this.title = title;
    }

    setDescription(description) {
        this.description = description;
    }

    setOnShowcase(show) {
        this.onShowcase = show;
    }

    setOrganizer(organizer) {
        this.organizer = organizer;
    }

    getId() {
        return this.id;
    }

    getTitle() {
        return this.title;
    }

    getDescription() {
        return this.description;
    }

    getOrganizer() {
        return this.organizer;
    }

    getDate() {
        return this.date;
    }

    getOnShowcase() {
        return this.onShowcase;
    }
    
    addDate(date) {
        this.date.push(date);
    }

    getJsonObj() {
        var jobj = '{' +
        '"title" : "'+ this.title+'",' + 
        '"description" : "'+ this.description+ '",' + 
        '"onShowcase" : '+ this.onShowcase+ ',' + 
        '"organizer" : { "id" : "' + this.organizer.id + '", "name" : "'+ this.organizer.name +'"}}';
        return JSON.parse(jobj);
    }
    
}

class EventDate {
    constructor(date) {
        this.date = date;
        this.classes = [];
        this.hours = [];
        this.place = '';
        this.id = SecurityCodeUtility.randomCode(6);
    }

    setClasses(classes) {
        this.classes = classes;
    }

    setPlace(place) {
        this.place = place;
    }

    setHours(hours) {
        this.hours = hours;
    }
}

class EventPlace {
    constructor(classroom, placeName) {
        if (placeName === undefined || placeName == null) {
            this.type = "INT"
            this.place = classroom;
        } else if (classroom === undefined || classroom == null) {
            this.type = "EXT"
            this.place = placeName;
        }
    }

    isInternal() {
        return (this.type == 'INT');
    }

    getPlaceName() {
        if (this.type == 'INT') {
            return this.place.name;
        } else if (this.type == 'EXT') {
            return this.place;
        }
    }

    getClassroomId() {
        if (this.type == 'INT') {
            return this.place.id;
        } else if (this.type == 'EXT') {
            console.log('The place is not internal.');        
        }
    }

    getJsonString() {
        var jobj = '{ "internal" : '+ (this.type == "INT") +', ';
        if (this.type == "INT") {
            jobj +='"name" : "' + this.place.name +'", "id" : "' + this.place.id +'"}';
        } else {
            jobj +='"name" : "' + this.place +'"}';
        }
        return jobj;
    }
}

class Teacher {
    constructor(teacher_id, teacher_name) {
        this.id = teacher_id;
        this.name = teacher_name;
    }
}

class Classroom {
    constructor(classroomId, classroomName) {
        this.id = classroomId;
        this.name = classroomName;
    }
}

class InstituteClass {
    constructor(class_id, class_name) {
        this.id = class_id;
        this.name = class_name;
    }
}

var Marconi = {
    user : "",
    admin : "", 

    eventHourPrenotation : function (dateStr, place, hour, eventTitle, eventKey) {
        if (place.isInternal) {
            var str = 'prenotation/'+dateStr.split('-')[0]+'/'+dateStr.split('-')[1]+'/'+dateStr.split('-')[2]+'/'+place.getClassroomId();
            hour.forEach(h => {
                firebase.database().ref(str).update({
                    [h] : {
                        event : eventTitle,
                        event_key : eventKey,
                        classroom : place.getPlaceName()
                    }
                });
            });
        }
    },
    
    classroomHourPrenotation : function() {
    },

    classEventPrenotation : function(eventId, eventTitle, date) {
        date.classes.forEach(c => {
            var str = 'class/'+c.id+'/event/'+eventId;
            var prenotText = 'event,'+eventId+','+eventTitle;
            firebase.database().ref(str).update({
                title : eventTitle
            });
            
            firebase.database().ref(str+'/date/').update({
                [date.date] : date.place.getPlaceName()
            });
            
            date.hours.forEach(h => {
                firebase.database().ref('class/'+c.id+'/prenotation/'+date.date).update({
                    [h] : prenotText
                });
            });
        });   
    }
}