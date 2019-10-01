import express from 'express';
import mongoose from 'mongoose';
import tus from 'tus-node-server';
import fileUpload from './fileUpload';


import authRoutes from './routes/auth';
import projectsRoutes from './routes/projects';
import samplesRoutes from './routes/samples';
import searchRoutes from './routes/search';
import groupRoutes from './routes/groups';
import userRoutes from './routes/users';
import newsRoutes from './routes/news';
import Utils from "./utils";
import path from 'path';

try {
  mongoose.connect('mongodb://localhost:27017/komondor', {useNewUrlParser: true});
} catch (err) {
  console.error(err);
}


//TUS
const tusServer = new tus.Server();
console.log('dir',__dirname);
tusServer.datastore = new tus.FileStore({
  directory: path.join(__dirname, '../','files'),
  path: '/api/uploads'
});
tusServer.on(tus.EVENTS.EVENT_UPLOAD_COMPLETE, (event) => {
  fileUpload.create(event);
});

//APP

// Transform req & res to have the same API as express
// So we can use res.status() & res.json()
// Create express router
const app = express();

//tus route
// const uploadApp = express();
// uploadApp.all('*', tusServer.handle.bind(tusServer));
// app.use('/api/uploads/', uploadApp);
const filesURL = '/uploads';
app.all([filesURL, filesURL + '/*', filesURL + '/*.*'], tusServer.handle.bind(tusServer));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

/**
 * get user if auth token in request
 */
app.use((req, res, next) => {
  Utils.getUserFromRequest(req)
    .then(user => {
      if (user) {
        req.user = user;
      }
      next();
    })
    .catch(err => {
      next(err);
    });

});

app.use(authRoutes);
app.use(projectsRoutes);
app.use(samplesRoutes);
app.use(searchRoutes);
app.use(groupRoutes);
app.use(userRoutes);
app.use(newsRoutes);


app.use((req, res, next) => {
  Object.setPrototypeOf(req, app.request);
  Object.setPrototypeOf(res, app.response);
  req.res = res;
  res.req = req;
  next()
});


// Export the server middleware
export default {
  path: '/api',
  handler: app
}
