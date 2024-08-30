import {
	getConversations,
	sendApiMessage,
	sendTemplate,
	handleWebhookGet,
	handleWebhookPost,
} from '../controller/conversations.controller.js';
import { auth } from '../middleware/Auth.js';

const ConversationRoutes = async (server, { pageAccessToken }) => {
	server.get('/', { preHandler: auth }, (req, reply) =>
		getConversations(req, reply, pageAccessToken)
	);

	server.post('/template', { preHandler: auth }, sendTemplate);

	server.post('/reply', { preHandler: auth }, sendApiMessage);

	server.get('/webhook', handleWebhookGet);

	server.post('/webhook', handleWebhookPost);
};

export default ConversationRoutes;
