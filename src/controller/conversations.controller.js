import {
	getDbMessages,
	groupDbMessagesByConversationId,
	updateMessageStatusDb,
} from '../../db.js';
import {
	fetchConversationsToDb,
	sendReplyMessage,
	sendTemplateMessage,
} from '../service/conversations.service.js';

const getConversations = async (req, reply, pageAccessToken) => {
	try {
		await fetchConversationsToDb(pageAccessToken);
		const messages = await getDbMessages();

		reply.status(200).send(groupDbMessagesByConversationId(messages));
	} catch (error) {
		reply.status(500).send({
			error: 'Internal Server Error: Failed to fetch conversations',
		});
		throw new Error(error);
	}
};

const sendTemplate = async (req, reply) => {
	const { username, message } = req.query;

	if (!username || !message) {
		return reply.status(400).send({
			error: 'Bad Request: Username and message are required',
		});
	}

	try {
		await sendTemplateMessage(username, message);
		reply.status(200).send({
			success: 'Message sent.',
		});
	} catch (error) {
		reply.status(500).send({
			error: 'Internal Server Error: Failed to send template message',
		});
	}
};

const sendApiMessage = async (req, reply) => {
	const { recipient, message } = req.query;

	if (!recipient || !message) {
		return reply.status(400).send({
			error: 'Bad Request: Recipient and message are required',
		});
	}

	try {
		await sendReplyMessage(recipient, message);
		reply.send({ success: 'Message sent.' });
	} catch (error) {
		reply.status(500).send({
			error: 'Internal Server Error: Failed to send message',
		});
	}
};

const handleWebhookGet = (req, reply) => {
	const WEBHOOK_CHALLENGE = process.env.WEBHOOK_CHALLENGE;
	let mode = req.query['hub.mode'];
	let token = req.query['hub.verify_token'];
	let challenge = req.query['hub.challenge'];

	if (mode && token) {
		if (mode === 'subscribe' && token === WEBHOOK_CHALLENGE) {
			console.log('WEBHOOK_VERIFIED');
			reply.status(200).send(challenge);
		} else {
			reply.status(403).send();
		}
	} else {
		reply.status(400).send({
			error: 'Bad Request: Missing mode or token',
		});
	}
};

const handleWebhookPost = async (req, reply) => {
	let body = req.body;
	console.log(`\u{1F7EA} Received webhook:`);
	console.dir(body, { depth: null });

	if (body.object === 'instagram') {
		body.entry.forEach(entry => {
			entry.messaging.forEach(event => {
				if (event.read) {
					const messageId = event.read.mid;
					updateMessageStatusDb(messageId, 'Read');
				}
			});
		});
		reply.status(200).send();
	} else {
		reply.status(404).send();
	}
};

export {
	getConversations,
	sendTemplate,
	sendApiMessage,
	handleWebhookGet,
	handleWebhookPost,
};
