var SecurityCodeUtility = {
    
    generateCode : function() {
        var code = [0,0,0,0,0,0];
        var letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
        var bigL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var smallL = "abcdefghijklmnopqrstuvwxyz";
        var even = "02468";
        var odd = "13579";
      
        var number_of_letters;
        var prev;

        for (var i = 0; i < 6; i++) {
            if (i == 0) {
                var val = this.randomIntFromInterval(0, 11);
                prev = val;
                number_of_letters = (val % 4) + 2;
                if (val == 10) {
                    val = bigL.charAt(Math.floor(Math.random() * bigL.length));
                } else if (val == 11) {
                    val = smallL.charAt(Math.floor(Math.random() * smallL.length));
                }
                code[i] = val;

                while (this.numberOfLetters(code) < number_of_letters) {
                    code[this.randomIntFromInterval(1, 5)] = letter.charAt(Math.floor(Math.random() * letter.length));
                }
            } else {
                if (!this.isLetter(code[i])) {
                    if (prev % 2 == 0) {
                        val = odd.charAt(Math.floor(Math.random() * odd.length));
                    } else {
                        val = even.charAt(Math.floor(Math.random() * odd.length));
                    } 
                    code[i] = val;
                    prev = val;
                } 
            }
        }
        return code.join("");
    },
    readCode : function(str) {
        var number_of_letters;
        var prev;
        var code = str.split("");
        if (code.length == 6) {
            if (this.isLetter(code[0])) {
                if (code[0] == code[0].toLowerCase()) {
                    number_of_letters = 5;
                    prev = 1;
                } else {
                    number_of_letters = 4;
                    prev = 2;
                }
                if (this.numberOfLetters(str) != number_of_letters) {
                    return false;
                }
            } else {
                number_of_letters = (code[0] % 4) + 2;
                prev = code[0];

                if (this.numberOfLetters(str) != number_of_letters) {
                    return false;
                }
            }

            for (i = 1; i < 6; i++) {
                if (!this.isLetter(code[i])) {
                    if (!((prev % 2 == 0 && code[i] % 2 != 0) || (code[i] % 2 == 0 && prev % 2 != 0))) {
                        return false;
                    }
                    prev = code[i];
                }
            }            
        } else {
            return false;
        }

        return true;
    },
    numberOfLetters : function (array) {
        var count = 0;
        for(var i = 0; i < array.length; i++){
            if (this.isLetter(array[i])) {
                count++;
            }
        }

        return count;
    },
    isLetter : function (str) {
        return !(/^\d+$/.test(str));
    },
    randomIntFromInterval : function(min,max) {
        return Math.floor(Math.random()*(max-min+1)+min);
    }
};