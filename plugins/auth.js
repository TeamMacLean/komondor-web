export default function ({ $auth }) {
  if (!$auth || !$auth.user || !$auth.user.username) {
    return;
  }

  const username = $auth.user.username;

  //   console.log("username", username);

  return {
    username,
  };
}
