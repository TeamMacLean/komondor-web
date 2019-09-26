export default function ({store, route, redirect, error}) {
  if (!store.getters.isAdmin) {
    error(new Error('Admins only'))
  }
}
