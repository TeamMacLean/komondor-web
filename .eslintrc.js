module.exports = {
    root: true,
    env: {
        node: true,
        browser: true
    },
    extends: [
        "plugin:vue/recommended",
        "eslint:recommended",
        "prettier/vue",
        "plugin:prettier/recommended"
    ],
    rules: {
        "vue/component-name-in-template-casing": ["error", "PascalCase"],
        /** 
         * Setting up the “no-console” rule like I did allows us to use 
         * console.log during development 
         * but treats it as an error when the project is in production mode, 
         * which is regarded as a best practice.
         */ 
        //"no-console": process.env.NODE_ENV === "production" ? "error" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off"
    },
    globals: {
        $nuxt: true
    },
    parserOptions: {
        parser: "babel-eslint"
    }
  };