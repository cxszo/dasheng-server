var mongoose = require('mongoose')

var IncrementSchema = new mongoose.Schema({
    type: String,//类型 userid articleid noteid push_articleid
    id: Number,//递增id
    startnum: Number//id起始值
}, { versionKey: false })





IncrementSchema.statics ={
    findAndModify : function (query, sort, doc, options, callback) {
        return this.collection.findAndModify(query, sort, doc, options, callback);
    }
}

module.exports = mongoose.model('Increment', IncrementSchema, 'increment')

