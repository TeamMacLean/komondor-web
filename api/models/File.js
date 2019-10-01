import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const schema = new Schema({
  uploadID: {type: String, required: true},
  name: {type: String, required: true},
  type: {type: String, required: true},
  originalName: {type: String, required: true},
  description: {type: String}
}, {timestamps: true});

const File = mongoose.model('File', schema);


export default File
