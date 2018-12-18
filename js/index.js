class InstituteEvent {
    constructor() {
        this.title = null;
        this.description = null;
        this.organizer = null;
        this.date = [];
    }

    setTitle(title) {
        this.title = title;
    }

    setDescription(description) {
        this.description = description;
    }

    setOrganizer(organizer) {
        this.organizer = organizer;
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

    /**
     *  date_1 : {
     *      class : {
     *          class_id_1 : class_name_1,
     *          class_id_2 : class_name_2,
     *          ...
     *          ...
     *      },
     *      place : {   
     *                  type : internal / external
     *                  classroomId : classroomId,
     *                  classroomName : classroomName,
     *                              or
     *                  place_name : place_name
     *      },
     *      hour : [8, 9, 10, ...]
     *  }
     */
    addDate(date) {
        this.date.push(date);
    }

    getJsonObj() {
        var jobj = '{' +
        '"title" : "'+ this.title+'",' + 
        '"description" : "'+ this.description+ '",' + 
        '"organizer" : { "id" : "' + this.organizer.id + '", "name" : "'+ this.organizer.name +'"},'+
        '"date" : [';

        this.date.forEach(eventDate => {
            jobj += '{"eventDate" : "'+eventDate.date+'", "class" : {';
            eventDate.classes.forEach(eventClass => {
                jobj += '"'+eventClass.id+'" : "'+ eventClass.name+'",';
            });
            jobj = jobj.substring(0, jobj.length - 1);
            jobj += '}, "place" : { "internal" : '+ eventDate.place.isInternal()+', ';
            if (eventDate.place.isInternal()) {
                jobj +='"name" : "' + eventDate.place.place.name +'", "id" : "' + eventDate.place.place.id +'"},';
            } else {
                jobj +='"name" : "' + eventDate.place.place +'"},';
            }
            jobj += '"hour" : [';
            eventDate.hours.forEach(hour => {
                jobj += '"' + hour + '",';
            });
            jobj = jobj.substring(0, jobj.length - 1);
            jobj += ']},'
        });
        if (jobj.substring(jobj.length-1) == ",") {
            jobj = jobj.substring(0, jobj.length - 1);
        }
        jobj += ']}';

        console.log(jobj);
        return JSON.parse(jobj);
    }
}

class EventDate {
    constructor(date) {
        this.date = date;
        this.classes = [];
        this.hours = [];
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