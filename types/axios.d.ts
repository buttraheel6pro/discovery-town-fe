/** Axios request config extensions used by auth interceptors. */
import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean
    skipRefresh?: boolean
  }

  interface InternalAxiosRequestConfig {
    skipAuth?: boolean
    skipRefresh?: boolean
  }
}
