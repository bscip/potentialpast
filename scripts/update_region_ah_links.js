/*
 * Run once to init areas and regions collections
 *
 */
var MM  = require('../models/rents.js');

MM.NBHood.distinct('region_name',{},function(err,res) {
    if (!res || res.length === 0) {
        console.log(err);
    }
    MM.Region.where('name').in(res).run(function(err,regs) {
        var reg_count = regs.length;
        regs.forEach(function(reg) {
            reg.ah_link = null;
            reg.save(function(err,s){
                reg_count--;
                if(reg_count === 0) {
                    done();
                }
            });
        });
    });
});

function done() {
    console.log('Done');
    MM.mongoose.disconnect();
}
