$(function() {
    jQuery('#datetimepicker').datetimepicker({
        minDate:'0',
        timepicker:false,
        format:'d.m.Y'
    });

    jQuery.datetimepicker.setLocale('it');
    $('#datetimepicker').hide();

    $('#bacheca_date').hover(() => {
        $('#datetimepicker').addClass('opened').show();
        $('#bacheca_date').addClass('collapse');
    });

    $('#datetimepicker').click(function(e) {
        e.stopPropagation();
    });

    $(document).click(function() {    	
        $('#datetimepicker').removeClass('opened').hide();
        $('#bacheca_date').removeClass('collapse');
    });
});