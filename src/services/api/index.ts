import { message } from 'antd';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

/** Key used in localStorage for the auth token; login/register set access_token here. */
export const TOKEN_KEY = 'bisp_token';

const request = axios.create({
	baseURL: BASE_URL,
	timeout: 30000,
});

// Attach auth token to requests
request.interceptors.request.use((config) => {
	const token = localStorage.getItem(TOKEN_KEY);
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

// Response Interceptor - log errors only; do not clear token or redirect on 401/403
request.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error) => {
		const status = error.response?.status;
		if (status === 401 || status === 403) {
			message.error(error.response?.data?.message ?? 'Session may have expired. Please try again.');
		}
		return Promise.reject(error);
	},
);

export default request;
