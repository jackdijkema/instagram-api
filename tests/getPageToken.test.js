/* eslint-disable no-undef */
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import getPageAccessToken from '../src/service/access_token.service.js'; // Ensure the path and filename are correct

describe('getPageAccessToken', () => {
	let axiosGetStub;

	beforeEach(() => {
		axiosGetStub = sinon.stub(axios, 'get');
	});

	afterEach(() => {
		axiosGetStub.restore();
	});

	it('should return the page access token when the request is successful', async () => {
		const mockResponse = {
			status: 200,
			data: {
				access_token: 'mockPageAccessToken',
			},
		};
		axiosGetStub.resolves(mockResponse);

		const pageId = 'mockPageId';
		const systemUserAccessToken = 'mockSystemUserAccessToken';
		const result = await getPageAccessToken(pageId, systemUserAccessToken);

		expect(result).to.equal('mockPageAccessToken');
		expect(axiosGetStub.calledOnce).to.be.true;
		expect(
			axiosGetStub.calledWith(`https://graph.facebook.com/v19.0/${pageId}`, {
				params: {
					fields: 'access_token',
					access_token: systemUserAccessToken,
				},
			})
		).to.be.true;
	});

	it('should throw an error when the request fails with a non-200 status code', async () => {
		const mockResponse = {
			status: 400,
			statusText: 'Bad Request',
		};
		axiosGetStub.resolves(mockResponse);

		const pageId = 'mockPageId';
		const systemUserAccessToken = 'mockSystemUserAccessToken';

		try {
			await getPageAccessToken(pageId, systemUserAccessToken);
			throw new Error('Test failed');
		} catch (error) {
			expect(error.message).to.equal(
				'Failed to fetch Page Access Token: 400 - Bad Request'
			);
		}

		expect(axiosGetStub.calledOnce).to.be.true;
		expect(
			axiosGetStub.calledWith(`https://graph.facebook.com/v19.0/${pageId}`, {
				params: {
					fields: 'access_token',
					access_token: systemUserAccessToken,
				},
			})
		).to.be.true;
	});

	it('should throw an error when the axios request fails', async () => {
		const mockError = new Error('Network Error');
		axiosGetStub.rejects(mockError);

		const pageId = 'mockPageId';
		const systemUserAccessToken = 'mockSystemUserAccessToken';

		try {
			await getPageAccessToken(pageId, systemUserAccessToken);
			throw new Error('Test failed');
		} catch (error) {
			expect(error.message).to.equal('Network Error');
		}

		expect(axiosGetStub.calledOnce).to.be.true;
		expect(
			axiosGetStub.calledWith(`https://graph.facebook.com/v19.0/${pageId}`, {
				params: {
					fields: 'access_token',
					access_token: systemUserAccessToken,
				},
			})
		).to.be.true;
	});
});
