import axios from 'axios';

const getPageAccessToken = async (pageId, systemUserAccessToken) => {
	const endpoint = `https://graph.facebook.com/v19.0/${pageId}`;

	const params = {
		fields: 'access_token',
		access_token: systemUserAccessToken,
	};

	try {
		const response = await axios.get(endpoint, { params });
		if (response.status === 200) {
			const pageAccessToken = response.data.access_token;
			return pageAccessToken;
		} else {
			throw new Error(
				`Failed to fetch Page Access Token: ${response.status} - ${response.statusText}`
			);
		}
	} catch (error) {
		console.error('Error fetching Page Access Token:', error.message);
		throw error;
	}
};

export default getPageAccessToken;
