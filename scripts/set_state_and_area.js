/*
 * Run once to init states and areas collections
 *
 */
var request      = require("request")
    , cheerio    = require("cheerio")
    , async      = require("async") 
    , MM         = require('../models/rents.js');

function setStatesAndAreas(cb) {
    request("http://www.craigslist.org/about/sites", function(err,resp,body) {
        var $ = cheerio.load(body);
        $('a[name="US"]').parent().parent().find('.state_delimiter').each( 
          function() {
            var state_name = $(this).html();
            var state = new MM.State({name: state_name});
            state.save(function(error, data) { 
                if (error) console.log('state save error'); 
            });
            $(this).next().find('a').each(function() {
                var area = new MM.Area({
                    name : $(this).html(),
                    state_name : state_name,
                    link : $(this).attr('href')
                });
                area.save(function(error, data) { 
                    if (error) console.log('area save error'); 
                });
            });
        });
    });
    setTimeout(function(){cb();},5000); // 5 seconds should be plenty
}
setStatesAndAreas(function(){
    MM.mongoose.disconnect();
    console.log('states and areas set');
});


