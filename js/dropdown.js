class CheckboxSelectDropdown {
    dropdownId;
    checkedElements = [];
    
    constructor (dropdownId) {
        this.dropdownId = dropdownId;
    }
}

$(".dropdown dt button").on('click', () => {
    $(".dropdown dd ul").slideToggle();
});


function getSelectedValue(id) {
    return $("#" + id).find("dt a span.value").html();
}

$(document).bind('click', function(e) {
    var $clicked = $(e.target);
    if (!$clicked.parents().hasClass("dropdown")) $(".dropdown dd ul").hide();
});

$('.mutliSelect input[type="checkbox"]').on('click', function() {
    var title = $(this).closest('.mutliSelect').find('input[type="checkbox"]').val(),
    title = $(this).val() + ",";
    if ($(this).is(':checked')) {
    } else {
        $('span[title="' + title + '"]').remove();
    }

    console.log(title);
});