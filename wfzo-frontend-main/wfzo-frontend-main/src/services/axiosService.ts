// import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

// const APP_URL = 'http://localhost:3000/api';
// const BASE_URL = process.env.NEXT_PUBLIC_APP_ROUTE_URL || APP_URL;

// export const getAxiosInstance = (token: string): AxiosInstance => {
//   const instance = axios.create({
//     baseURL: BASE_URL,
//     headers: {
//       Accept: 'application/json',
//       'Content-Type': 'application/json',
//     },
//     timeout: 10000,
//   });

//   // Request Interceptor
//   instance.interceptors.request.use(
//     (config: InternalAxiosRequestConfig) => {
//       if (token) {
//         config.headers.set('Authorization', `Bearer ${token}`);
//       }
//       if (!config.headers.has('Content-Type')) {
//         config.headers.set('Content-Type', 'application/json');
//       }
//       return config;
//     },
//     (error: AxiosError) => {
//       return Promise.reject(error);
//     }
//   );

//   // Response Interceptor
//   instance.interceptors.response.use(
//     (response: AxiosResponse) => {
//       return response;
//     },
//     (error: AxiosError) => {
//       if (error.response) {
//         return Promise.reject(error.response.data);
//       } else {
//         return Promise.reject({ message: 'Network Error', error });
//       }
//     }
//   );

//   return instance;
// };
