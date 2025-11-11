/**
 * Global error handler plugin
 * Handles API errors and provides user-friendly feedback
 */

export default ({ $axios, store, redirect, app }) => {
  // Track if we're already redirecting to prevent loops
  let isRedirecting = false

  /**
   * Global axios error interceptor
   */
  $axios.onError((error) => {
    const code = parseInt(error.response?.status)
    const message = error.response?.data?.message
    const url = error.config?.url

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url,
        status: code,
        message,
        error: error.response?.data,
      })
    }

    // Handle specific error codes
    switch (code) {
      case 400:
        // Bad Request
        if (app.$buefy) {
          app.$buefy.toast.open({
            message: message || 'Invalid request. Please check your input.',
            type: 'is-danger',
            duration: 4000,
          })
        }
        break

      case 401:
        // Unauthorized - redirect to login
        if (!isRedirecting && !url?.includes('/login')) {
          isRedirecting = true

          if (app.$buefy) {
            app.$buefy.toast.open({
              message: 'Your session has expired. Please login again.',
              type: 'is-warning',
              duration: 3000,
            })
          }

          // Clear auth state
          if (store.state.auth?.loggedIn) {
            store.commit('auth/logout')
          }

          // Redirect to signin
          setTimeout(() => {
            redirect('/signin')
            isRedirecting = false
          }, 500)
        }
        break

      case 403:
        // Forbidden - Access denied
        if (app.$buefy) {
          app.$buefy.toast.open({
            message:
              message ||
              'Access denied. You do not have permission to perform this action.',
            type: 'is-danger',
            duration: 4000,
          })
        }
        break

      case 404:
        // Not Found
        if (app.$buefy) {
          app.$buefy.toast.open({
            message: message || 'The requested resource was not found.',
            type: 'is-warning',
            duration: 3000,
          })
        }
        break

      case 409:
        // Conflict - usually duplicate resource
        if (app.$buefy) {
          app.$buefy.toast.open({
            message: message || 'This resource already exists.',
            type: 'is-warning',
            duration: 4000,
          })
        }
        break

      case 422:
        // Unprocessable Entity - validation error
        if (app.$buefy) {
          const validationMessage =
            message || 'Please check your input and try again.'
          app.$buefy.toast.open({
            message: validationMessage,
            type: 'is-danger',
            duration: 5000,
          })
        }
        break

      case 429:
        // Too Many Requests
        if (app.$buefy) {
          app.$buefy.toast.open({
            message: 'Too many requests. Please slow down and try again.',
            type: 'is-warning',
            duration: 4000,
          })
        }
        break

      case 500:
        // Internal Server Error
        if (app.$buefy) {
          app.$buefy.toast.open({
            message:
              message ||
              'An unexpected server error occurred. Please try again later.',
            type: 'is-danger',
            duration: 5000,
          })
        }
        break

      case 502:
        // Bad Gateway
        if (app.$buefy) {
          app.$buefy.toast.open({
            message: 'Server is temporarily unavailable. Please try again.',
            type: 'is-danger',
            duration: 4000,
          })
        }
        break

      case 503:
        // Service Unavailable
        if (app.$buefy) {
          app.$buefy.toast.open({
            message:
              'Service is temporarily unavailable. Please try again later.',
            type: 'is-danger',
            duration: 5000,
          })
        }
        break

      default:
        // Generic error handling
        if (error.message === 'Network Error') {
          // Network connectivity issue
          if (app.$buefy) {
            app.$buefy.toast.open({
              message:
                'Unable to connect to the server. Please check your internet connection.',
              type: 'is-danger',
              duration: 5000,
            })
          }
        } else if (message) {
          // Show custom error message from API
          if (app.$buefy) {
            app.$buefy.toast.open({
              message,
              type: 'is-danger',
              duration: 4000,
            })
          }
        } else if (code) {
          // Show generic error with status code
          if (app.$buefy) {
            app.$buefy.toast.open({
              message: `An error occurred (${code}). Please try again.`,
              type: 'is-danger',
              duration: 4000,
            })
          }
        }
    }

    // Always reject the error to allow component-level handling
    return Promise.reject(error)
  })

  /**
   * Global axios response interceptor for success messages
   * Only show success messages for non-GET requests that include a message
   */
  $axios.onResponse((response) => {
    const method = response.config.method?.toLowerCase()
    const message = response.data?.message

    // Show success message for create/update/delete operations
    if (
      message &&
      method &&
      ['post', 'put', 'patch', 'delete'].includes(method)
    ) {
      if (app.$buefy) {
        app.$buefy.toast.open({
          message,
          type: 'is-success',
          duration: 3000,
        })
      }
    }

    return response
  })

  /**
   * Global axios request interceptor
   * Add any custom headers or logging
   */
  $axios.onRequest((config) => {
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', config.method?.toUpperCase(), config.url)
    }

    return config
  })
}
