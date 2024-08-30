import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export const dbPromise = open({
	filename: './conversations.db',
	driver: sqlite3.Database,
});

export const createTablesDb = async () => {
	const db = await dbPromise;
	await db.exec(`
		CREATE TABLE IF NOT EXISTS conversations (
			id TEXT PRIMARY KEY
		);

		CREATE TABLE IF NOT EXISTS messages (
			id TEXT PRIMARY KEY,
			created_time TEXT,
			from_id TEXT,
            from_username TEXT,
			to_id TEXT,
            to_username TEXT,
			message TEXT,
			status TEXT,
            conversation_id TEXT,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        );
	`);
};

export const insertConversationsDb = async conversations => {
	const db = await dbPromise;
	const stmt = await db.prepare(`
		INSERT OR REPLACE INTO conversations (id)
		VALUES (?)
	`);

	for (const conversation of conversations) {
		await stmt.run(conversation);
	}

	await stmt.finalize();
};

export const insertMessagesDb = async messages => {
	const db = await dbPromise;
	const stmt = await db.prepare(`
		INSERT OR REPLACE INTO messages (id, created_time, from_id, to_id, from_username, to_username, message, status, conversation_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	for (const message of messages) {
		// console.log('MESSAGE INSERT MESSAGES', message);
		await stmt.run(
			message.id,
			message.created_time,
			message.from.id,
			message.to.data[0].id,
			message.from.username,
			message.to.data[0].username,
			message.message,
			message.status,
			message.conversation_id
		);
	}

	await stmt.finalize();
};

export const updateMessageStatusToRepliedDb = async adminUsername => {
	const messages = await getDbMessages();
	const groupedMessages = groupDbMessagesByConversationId(messages);
	await changeStatusPerConversation(groupedMessages, adminUsername);
};

export const updateMessageStatusDb = async (messageId, status) => {
	const db = await dbPromise;
	try {
		const result = await db.run(
			`UPDATE messages SET status = ? WHERE id = ?`,
			status,
			messageId
		);
		if (result.changes > 0) {
			console.log(`Message ID ${messageId} status updated to ${status}`);
		} else {
			console.log(`Message ID ${messageId} not found in the database.`);
		}
	} catch (error) {
		console.error(`Error updating message status in db: ${error.message}`);
		throw error;
	}
};

export const getDbMessages = async () => {
	const db = await dbPromise;
	const messages = await db.all(`
		SELECT conversation_id, id, created_time, from_username, to_username, message, status
		FROM messages
		ORDER BY conversation_id, datetime(created_time)
	`);
	return messages;
};

export const getGroupedMessagesByConversationIdDb = async () => {
	const messages = await getDbMessages();
	const convos = await groupDbMessagesByConversationId(messages);
	return convos;
};

export const groupDbMessagesByConversationId = messages => {
	const groupedMessages = messages.reduce((acc, message) => {
		if (!acc[message.conversation_id]) {
			acc[message.conversation_id] = [];
		}
		acc[message.conversation_id].push(message);
		return acc;
	}, {});
	return groupedMessages;
};

export const changeStatusPerConversation = async (
	groupedMessages,
	adminUsername
) => {
	for (const conversationId in groupedMessages) {
		const messages = groupedMessages[conversationId];
		let lastAdminMessageTime = null;

		for (const message of messages) {
			if (message.from_username === adminUsername) {
				lastAdminMessageTime = message.created_time;
			}

			if (new Date(message.created_time) > new Date(lastAdminMessageTime)) {
				updateMessageStatusDb(message.id, 'replied');
			}
		}
	}
};
