

export default {
  isAuthenticated: (req, res, next) => {

    if(req.user){
      next()
    } else {
      next(new Error('user not found'))
    }


    // Utils.getUserFromRequest(req)
    //   .then(user => {
    //     if(user){
    //         // req.user = user;
    //     next();
    //     } else {
    //
    //     }
    //   })
    //   .catch(err => {
    //     next(err);
    //   })
  }
}
