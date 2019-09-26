import mongoose from 'mongoose';
import Utils from "../utils";
// import Project from "./Project";

const Schema = mongoose.Schema;
const schema = new Schema({
  name: {type: String, required: true, unique: true},
  safeName: {type: String, required: true},
  ldapGroups: {type: [String], required: true},
  deleted: {type: Boolean, default: false},
  sendToEna: {type: Boolean, default: false}
}, {timestamps: true});

schema.pre('validate', function () {
  return Group.find({})
    .then(allOthers => {
      return Utils.generateSafeName(this.name, allOthers);
    })
    .then(safeName => {
      this.safeName = safeName;
      return Promise.resolve()
    })
});

schema.statics.GroupsIAmIn = function GroupsIAmIn(user) {
  if (user.isAdmin) {
    return Group.find({})
  }


  if (user.groups) {
    return Group.find({
      '_id': {$in: user.groups}
    });

  } else if (user.memberOf) {

    const filters = [];
    user.memberOf.map(g => {
      filters.push({'ldapGroups': g})
    });
    return Group.find({$or: filters})

  } else {
    return Promise.resolve([])
  }

};

const Group = mongoose.model('Group', schema);

export default Group
