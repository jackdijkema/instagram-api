'use strict';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { createTablesDb } from './db.js';

import ConversationRoutes from './src/routes/conversations.routes.js';
import getPageAccessToken from './src/service/access_token.service.js';

dotenv.config();

const HOST = process.env.HOST;
const PORT = process.env.PORT;
const PAGE_ID = process.env.PAGE_ID;
const SYSTEM_USER_TOKEN = process.env.SYSTEM_USER_TOKEN;

const server = Fastify({
	logger: true,
});

const start = async () => {
	const pageAccessToken = await getPageAccessToken(PAGE_ID, SYSTEM_USER_TOKEN);

	server.register(fastifyCors, {
		origin: '*',
		methods: 'GET, POST',
	});

	server.register(ConversationRoutes, {
		prefix: '/api/v1/messages',
		pageAccessToken,
	});

	try {
		server.listen({ port: PORT, host: HOST });
		createTablesDb();
	} catch (err) {
		server.log.error(err);
		process.exit(1);
	}
};
start();
