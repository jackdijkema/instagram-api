import dotenv from 'dotenv';

dotenv.config();

export async function auth(req, res) {
	const apiKey = req.headers['x-api-key'];
	const knownKey = process.env.ENGINE_API_KEY;

	if (!apiKey || apiKey !== knownKey) {
		return res.code(401).send({ error: 'Unauthorized.' });
	}
}
