import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const schema = new Schema({
  name: {type: String, required: true},
}, {timestamps: true});

const File = mongoose.model('File', schema);


export default File
