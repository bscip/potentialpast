var mongoose = require('mongoose/')
    , Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/rents');

console.log('setting some schemas');

var State = new Schema();
State.add({name : {type: String, required: true }});

var Area = new Schema();
Area.add({name : {type: String, required: true }, state_name : {type: String, required: true }});

var Region = new Schema();
Region.add({name : {type: String, required: true }, area_name : {type: String, required: true }});


console.log('saving schemas');
State  = mongoose.model('State', State);
Area   = mongoose.model('Area', Area);
Region = mongoose.model('Region', Region);

//console.log('saving data');
var state = new State({name: 'California'});
//state.save(function(error,data) { if (error) console.log(error); });
console.log('finding data');
State.find({name: 'California'}, function(error, state) {
            if (error) console.log(error);
            else if (state === null) console.log('no such state');
            else {
                console.log('found your state:');
                console.log(state);
            }
            mongoose.disconnect();
        });
        
