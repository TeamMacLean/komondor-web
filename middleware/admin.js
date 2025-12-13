export default function ({ store, _route, _redirect, error }) {
  if (!store.getters.isAdmin) {
    error(new Error("Admins only"));
  }
}
