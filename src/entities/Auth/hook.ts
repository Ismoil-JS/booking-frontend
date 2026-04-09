import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeMutation } from './api';

export const useAuth = () => {
	const token = sessionStorage.getItem('token');
	const navigate = useNavigate();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const { mutateAsync, isPending, isError, error } = useMeMutation();

	useEffect(() => {
		if (!Boolean(token)) return;
		if (!token) navigate('/');

		const getMe = async () => {
			try {
				await mutateAsync();
				setIsAuthenticated(true);
			} catch (e: unknown) {
				const err = e as { status?: string | number; response?: { status?: number } };
				const status = err?.response?.status ?? err?.status;
				if (status === 401 || status === 403 || status === '401' || status === '403') {
					// message.error('Please login again.');
					navigate('/');
				}
			}
		};

		void getMe();
	}, [token, mutateAsync, navigate]);

	return { isLoading: isPending, isError, error, isAuthenticated };
};
