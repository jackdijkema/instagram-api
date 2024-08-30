/* eslint-disable no-undef */
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import {
	fetchConversationIds,
	fetchConversationMessageIds,
	fetchConversationMessages,
	sendReplyMessage,
	sendTemplateMessage,
} from '../src/service/conversations.service.js';
import { IgApiClient } from 'instagram-private-api';

describe('ConversationServices', function () {
	let axiosGetStub,
		axiosPostStub,
		igApiClientInstance,
		broadcastTextStub,
		directThreadStub,
		consoleLogStub;

	beforeEach(function () {
		axiosGetStub = sinon.stub(axios, 'get');
		axiosPostStub = sinon.stub(axios, 'post');
		// Create a real instance of IgApiClient to stub its methods
		igApiClientInstance = new IgApiClient();
		sinon.stub(igApiClientInstance.user, 'getIdByUsername');

		// Stub the broadcastText method of directThread
		broadcastTextStub = sinon.stub();
		directThreadStub = sinon
			.stub(igApiClientInstance.entity, 'directThread')
			.returns({
				broadcastText: broadcastTextStub,
			});
		consoleLogStub = sinon.stub(console, 'log');
	});

	afterEach(function () {
		axiosGetStub.restore();
		axiosPostStub.restore();
		igApiClientInstance.user.getIdByUsername.restore();
		directThreadStub.restore();
		consoleLogStub.restore();
	});

	describe('fetchConversationIds', function () {
		it('should return conversation IDs when the request is successful', async function () {
			const mockResponse = {
				status: 200,
				data: { data: [{ id: 'conv1' }, { id: 'conv2' }] },
			};
			axiosGetStub.resolves(mockResponse);

			const pageAccessToken = 'mockPageAccessToken';
			const result = await fetchConversationIds(pageAccessToken);

			expect(result).to.deep.equal(['conv1', 'conv2']);
			expect(axiosGetStub.calledOnce).to.be.true;
		});

		it('should throw an error when the request fails', async function () {
			axiosGetStub.rejects(new Error('Request failed'));

			const pageAccessToken = 'mockPageAccessToken';

			try {
				await fetchConversationIds(pageAccessToken);
				throw new Error('Test failed');
			} catch (error) {
				expect(error.message).to.equal(
					'Failed to fetch conversations: Request failed'
				);
			}
		});
	});

	describe('fetchConversationMessageIds', function () {
		it('should return messages when the request is successful', async function () {
			const mockResponse = {
				status: 200,
				data: {
					messages: { data: [{ id: 'msg1' }, { id: 'msg2' }] },
					id: 'conv1',
				},
			};
			axiosGetStub.resolves(mockResponse);

			const pageAccessToken = 'mockPageAccessToken';
			const conversationIds = ['conv1'];

			const result = await fetchConversationMessageIds(
				pageAccessToken,
				conversationIds
			);

			expect(result).to.deep.equal([mockResponse.data]);
			expect(axiosGetStub.calledOnce).to.be.true;
		});

		it('should throw an error when the request fails', async function () {
			axiosGetStub.rejects(new Error('Request failed'));

			const pageAccessToken = 'mockPageAccessToken';
			const conversationIds = ['conv1'];

			try {
				await fetchConversationMessageIds(pageAccessToken, conversationIds);
				throw new Error('Test failed');
			} catch (error) {
				expect(error.message).to.equal(
					'Failed to fetch conversation messages: Request failed'
				);
			}
		});
	});

	describe('fetchConversationMessages', function () {
		it('should return messages when the request is successful', async function () {
			const mockResponse = {
				status: 200,
				data: {
					id: 'msg1',
					created_time: '2024-06-14T14:04:30+0000',
					from: { username: 'jacktester24', id: '17841466505546658' },
					to: { username: 'jackdijkema', id: ' 12345678' },
					message: 'testmsg',
				},
			};
			axiosGetStub.resolves(mockResponse);

			const pageAccessToken = 'mockPageAccessToken';
			const messageIds = [
				{
					id: 'conv1',
					messages: { data: [{ id: 'msg1' }] },
				},
			];

			const result = await fetchConversationMessages(
				pageAccessToken,
				messageIds
			);

			expect(result).to.deep.equal([
				{
					...mockResponse.data,
					conversation_id: 'conv1',
					status: 'unread',
				},
			]);
			expect(axiosGetStub.calledOnce).to.be.true;
		});

		it('should throw an error when the request fails', async function () {
			axiosGetStub.rejects(new Error('Request failed'));

			const pageAccessToken = 'mockPageAccessToken';
			const messageIds = [
				{
					id: 'conv1',
					messages: { data: [{ id: 'msg1' }] },
				},
			];

			try {
				await fetchConversationMessages(pageAccessToken, messageIds);
				throw new Error('Test failed');
			} catch (error) {
				expect(error.message).to.equal(
					'Failed to fetch full conversations: Request failed'
				);
			}
		});
	});

	describe('sendReplyMessage', function () {
		it('should return response data when the request is successful', async function () {
			const mockResponse = {
				status: 200,
				data: { id: 'msg1' },
			};
			axiosPostStub.resolves(mockResponse);

			const pageAccessToken = 'mockPageAccessToken';
			const recipientId = 'recipient1';
			const message = 'Hello';

			const result = await sendReplyMessage(
				pageAccessToken,
				recipientId,
				message
			);

			expect(result).to.deep.equal(mockResponse.data);
			expect(axiosPostStub.calledOnce).to.be.true;
		});

		it('should throw an error when the request fails', async function () {
			axiosPostStub.rejects(new Error('Request failed'));

			const pageAccessToken = 'mockPageAccessToken';
			const recipientId = 'recipient1';
			const message = 'Hello';

			try {
				await sendReplyMessage(pageAccessToken, recipientId, message);
				throw new Error('Test failed');
			} catch (error) {
				expect(error.message).to.equal(
					'Failed to send message: Request failed'
				);
			}
		});
	});
});
