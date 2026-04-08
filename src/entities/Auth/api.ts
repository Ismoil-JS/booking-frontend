import request from '@/services/api';
import { useMutation, useQuery } from '@tanstack/react-query';

export const loginApi = async (credentials: {
	email: string;
	password: string;
}) => {
	try {
		const response = await request.post('/auth/login', credentials);
		return response.data;
	} catch (error: any) {
		throw error;
	}
};

export const useLoginMutation = () => {
	return useMutation({
		mutationFn: loginApi,
		onError: (_error: unknown) => {},
	});
};

export type RegisterPayload = {
	fullName: string;
	email: string;
	password: string;
	phone: string;
	userType: 'LEARNER' | 'TUTOR';
};

export type GoogleAuthPayload = {
	idToken: string;
	userType?: 'LEARNER' | 'TUTOR';
};

export const registerApi = async (payload: RegisterPayload) => {
	try {
		const response = await request.post('/auth/register', payload);
		return response.data;
	} catch (error: any) {
		throw error;
	}
};

export const useRegisterMutation = () => {
	return useMutation({
		mutationFn: registerApi,
		onError: (_error: unknown) => {},
	});
};

export const googleAuthApi = async (payload: GoogleAuthPayload) => {
	try {
		const response = await request.post('/auth/google', payload);
		return response.data;
	} catch (error: any) {
		throw error;
	}
};

export const getMe = async () => {
	try {
		const response = await request.get('/auth/me');

		return response.data;
	} catch (error: any) {
		throw error;
	}
};

export const useGetMe = () => {
	return useQuery({ queryKey: ['me'], queryFn: getMe });
};

export const useMeMutation = () => {
	return useMutation({
		mutationFn: getMe,
	});
};

export type UpdateMyProfilePayload = {
	phone?: string;
};

export const updateMyProfileApi = async (payload: UpdateMyProfilePayload) => {
	const endpoints = ['/users/profile', '/auth/me'];
	let lastError: unknown;

	for (const endpoint of endpoints) {
		try {
			const response = await request.patch(endpoint, payload);
			return response.data;
		} catch (error: any) {
			// If route doesn't exist, try the next known profile endpoint.
			if (error?.response?.status === 404) {
				lastError = error;
				continue;
			}
			throw error;
		}
	}

	throw lastError;
};

export const useUpdateMyProfileMutation = () => {
	return useMutation({
		mutationFn: updateMyProfileApi,
	});
};

const resetPassword = async (credentials: {
	oldPassword: string;
	newPassword: string;
}) => {
	try {
		const response = await request.patch('/users/change-password', null, {
			params: {
				oldPassword: credentials.oldPassword,
				newPassword: credentials.newPassword,
			},
		});
		return response.data;
	} catch (error: any) {
		throw error;
	}
};

export const useResetPasswordMutation = () => {
	return useMutation({
		mutationFn: resetPassword,
	});
};
