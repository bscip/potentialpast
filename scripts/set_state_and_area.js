/*
 * Run once to init states and areas collections
 *
 */
var jsdom      = require("jsdom")
    , MM = require('../models/rents.js')
    , js_jq_link = 'http://code.jquery.com/jquery-1.7.1.min.js';

function setStatesAndAreas() {
    jsdom.env(
        "http://www.craigslist.org/about/sites",
        [js_jq_link],
        function(errors,window) {
            if (errors) {
                console.log(errors);
            }
            else {
                var $ = window.$;
            }
            $.each($('a[name="US"]').parents('.colmask').find('.state_delimiter'), 
                function() {
                    var state_name = $(this).html();
                    var state = new MM.State({name: state_name});
                    state.save(function(error, data) { if (error) console.log('state save error'); });
                    $.each($(this).next().find('a'),
                        function() {
                            var area = new MM.Area({
                                    name : $(this).html(),
                                    state_name : state_name,
                                    link : $(this).attr('href')
                                });
                            area.save(function(error, data) { if (error) console.log('area save error'); });
                        });
                });
            window.close();
        }
    );
}
setStatesAndAreas();


