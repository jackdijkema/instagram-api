import { IgApiClient } from 'instagram-private-api';
import axios from 'axios';
import dotenv from 'dotenv';
import { setTimeout } from 'node:timers/promises';
import {
	insertConversationsDb,
	insertMessagesDb,
	updateMessageStatusToRepliedDb,
} from '../../db.js';

dotenv.config();

const ENDPOINT_URL = 'https://graph.facebook.com/v20.0/';
const IG_PASSWORD = process.env.IG_PASSWORD;
const IG_USERNAME = process.env.IG_USERNAME;
const PAGE_ID = process.env.PAGE_ID;

const igClient = new IgApiClient();
igClient.state.generateDevice(IG_USERNAME);

try {
	if (!IG_PASSWORD == '' && !IG_USERNAME == '') {
		await igClient.account.login(IG_USERNAME, IG_PASSWORD);
		console.log('Instagram logged in...');
	} else {
		console.error(
			'Skipping instagram login... - .env variables empty/incomplete'
		);
	}
} catch (error) {
	console.error('Error logging into Instagram:', error.message);
	throw new Error('Failed to login to Instagram');
}

const fetchConversationIds = async pageAccessToken => {
	const endpoint = `${ENDPOINT_URL}${PAGE_ID}/conversations`;
	try {
		const params = {
			access_token: pageAccessToken,
			platform: 'instagram',
		};

		const response = await axios.get(endpoint, { params });

		if (response.status === 200) {
			const conversationIds = response.data.data.map(
				conversation => conversation.id
			);
			insertConversationsDb(conversationIds);

			return conversationIds;
		} else {
			throw new Error(
				`Failed to fetch conversations: ${response.status} - ${response.statusText}`
			);
		}
	} catch (error) {
		console.error(`Error in fetchConversationIds: ${error.message}`);
		throw new Error(`Failed to fetch conversations: ${error.message}`);
	}
};

const fetchConversationMessageIds = async (
	pageAccessToken,
	conversationIds
) => {
	try {
		const promises = conversationIds.map(async conversationId => {
			const endpoint = `${ENDPOINT_URL}${conversationId}`;

			const params = {
				fields: 'messages',
				access_token: pageAccessToken,
			};

			const response = await axios.get(endpoint, { params });

			if (response.status === 200) {
				return response.data;
			} else {
				throw new Error(
					`Failed to fetch messages for conversation ${conversationId}: ${response.status} - ${response.statusText}`
				);
			}
		});
		const allMessages = await Promise.all(promises);
		return allMessages;
	} catch (error) {
		console.error(`Error in fetchConversationMessageIds: ${error.message}`);
		throw new Error(`Failed to fetch conversation messages: ${error.message}`);
	}
};

const fetchConversationMessages = async (pageAccessToken, messageIds) => {
	try {
		for (const conversation of messageIds) {
			const promises = conversation.messages.data.map(async messageId => {
				const endpoint = `${ENDPOINT_URL}${messageId.id}`;

				const params = {
					fields: 'id, created_time, from, to, message',
					access_token: pageAccessToken,
				};

				const response = await axios.get(endpoint, { params });

				if (response.status === 200) {
					let responseData = response.data;
					responseData.conversation_id = conversation.id;
					responseData.status = 'unread';

					return responseData;
				} else {
					throw new Error(
						`Failed to fetch message ${messageId.id}: ${response.status} - ${response.statusText}`
					);
				}
			});

			const allMessages = await Promise.all(promises);

			insertMessagesDb(allMessages);
			updateMessageStatusToRepliedDb(IG_USERNAME);
			return allMessages;
		}
	} catch (error) {
		console.error(`Error in fetchConversationMessages: ${error.message}`);
		throw new Error(`Failed to fetch full conversations: ${error.message}`);
	}
};

const fetchConversationsToDb = async pageAccessToken => {
	try {
		const conversationIds = await fetchConversationIds(pageAccessToken);
		if (!Array.isArray(conversationIds)) {
			throw new Error('fetchConversationIds did not return an array');
		}
		console.log('Fetched conversation IDs:', conversationIds);

		const messageIds = await fetchConversationMessageIds(
			pageAccessToken,
			conversationIds
		);
		if (!Array.isArray(messageIds)) {
			throw new Error('fetchConversationMessageIds did not return an array');
		}
		console.log('Fetched message IDs:', messageIds);

		const messages = await fetchConversationMessages(
			pageAccessToken,
			messageIds
		);
		if (!Array.isArray(messages)) {
			throw new Error('fetchConversationMessages did not return an array');
		}
		console.log('Fetched conversation messages:', messages);
	} catch (error) {
		console.error('Error in fetchConversationsToDb:', error);
		throw new Error('Failed to fetch conversations to DB: ' + error.message);
	}
};

// official api
const sendReplyMessage = async (pageAccessToken, recipientId, message) => {
	const endpoint = `${ENDPOINT_URL}me/messages`;
	try {
		const payload = {
			recipient: { id: recipientId },
			message: { text: message },
			access_token: pageAccessToken,
		};

		const response = await axios.post(endpoint, null, { params: payload });

		if (response.status === 200) {
			return response.data;
		} else {
			throw new Error(
				`Failed to send message: ${response.status} - ${response.statusText}`
			);
		}
	} catch (error) {
		console.error(`Error in sendBasicMessage: ${error.message}`);
		throw new Error(`Failed to send message: ${error.message}`);
	}
};

// unofficial api
const sendTemplateMessage = async (username, message) => {
	try {
		setTimeout(1000);
		const userId = await igClient.user.getIdByUsername(username);

		if (!userId) {
			throw new Error(`User ID not found for username: ${username}`);
		}

		const thread = igClient.entity.directThread([userId.toString()]);
		await thread.broadcastText(message);
		console.log('Message sent:', username, userId);
	} catch (error) {
		console.error('Error in sendTemplateMessage:', error.message);
		console.log('is account info in .env?');
		throw new Error(
			`Failed to send template message to ${username}: ${error.message}`
		);
	}
};

export {
	fetchConversationIds,
	fetchConversationMessageIds,
	fetchConversationMessages,
	sendReplyMessage,
	sendTemplateMessage,
	fetchConversationsToDb,
};
