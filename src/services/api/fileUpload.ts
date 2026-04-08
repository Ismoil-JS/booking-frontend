import { message } from 'antd';
import axios from 'axios';

interface UploadResponse {
	data: string; // API returns { data: "uploaded_file_url" }
}

export const uploadFiles = async (
	file: File | null,
	name?: string,
): Promise<any> => {
	if (!file) return;

	try {
		const token = sessionStorage.getItem('token');
		const axiosInstance = axios.create({
			baseURL: import.meta.env.VITE_BASE_URL,
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'multipart/form-data',
				bucketName: String(name),
			},
		});

		const formData = new FormData();
		formData.append('file', file);

		const response = await axiosInstance.post<UploadResponse>(
			`gateway/api-filefs/api/rfs/uploadfile`,
			formData,
		);
		return response.data;
	} catch (error: unknown) {
		if (axios.isAxiosError(error)) {
			const msg = (error.response?.data as { resultMsg?: string })?.resultMsg;
			message.error(msg || 'Something went wrong uploading file');
			throw new Error(msg || 'Unknown error');
		}
		throw new Error('Unexpected error occurred');
	}
};
