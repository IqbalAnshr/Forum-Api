const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('/threads endpoint', () => {
  let server;
  let accessToken;

  beforeAll(async () => {
    server = await createServer(container);
    // Create a user and get access token for authentication
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'testuser' });
    const tokenManager = container.getInstance(AuthenticationTokenManager.name);
    accessToken = await tokenManager.createAccessToken({ id: 'user-123', username: 'testuser' });
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await ThreadTableTestHelper.cleanTable();
  });

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread', async () => {
      // Arrange
      const requestPayload = {
        title: 'Test Thread',
        body: 'This is a test thread body',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedThread).toBeDefined();

      // Verify the thread is actually in database
      const threads = await ThreadTableTestHelper.findThreadsById(responseJson.data.addedThread.id);
      expect(threads).toHaveLength(1);
      expect(threads[0].title).toEqual(requestPayload.title);
      expect(threads[0].body).toEqual(requestPayload.body);
      expect(threads[0].owner).toEqual('user-123');
    });

    it('should response 401 when request not authenticated', async () => {
      // Arrange
      const requestPayload = {
        title: 'Test Thread',
        body: 'This is a test thread body',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads',
        payload: requestPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');

      // Verify no thread was added
      const threads = await ThreadTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(0);
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const invalidPayloads = [
        { title: 'Test Thread' }, // missing body
        { body: 'Test body' }, // missing title
        {}, // missing both
      ];

      await Promise.all(
        invalidPayloads.map(async (requestPayload) => {
          // Action
          const response = await server.inject({
            method: 'POST',
            url: '/threads',
            payload: requestPayload,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Assert
          const responseJson = JSON.parse(response.payload);
          expect(response.statusCode).toEqual(400);
          expect(responseJson.status).toEqual('fail');
          expect(responseJson.message).toEqual('tidak dapat membuat thread karena properti yang dibutuhkan tidak ada');
        }),
      );
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const invalidPayloads = [
        { title: 123, body: 'Valid body' }, // invalid title type
        { title: 'Valid title', body: 123 }, // invalid body type
        { title: true, body: 'Valid body' }, // invalid title type
        { title: 'Valid title', body: ['array body'] }, // invalid body type
      ];

      await Promise.all(
        invalidPayloads.map(async (requestPayload) => {
          // Action
          const response = await server.inject({
            method: 'POST',
            url: '/threads',
            payload: requestPayload,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Assert
          const responseJson = JSON.parse(response.payload);
          expect(response.statusCode).toEqual(400);
          expect(responseJson.status).toEqual('fail');
          expect(responseJson.message).toEqual('tidak dapat membuat thread karena tipe data tidak sesuai');
        }),
      );
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 200 and return thread details', async () => {
      // Arrange
      const threadId = 'thread-123';
      await ThreadTableTestHelper.addThread({
        id: threadId,
        title: 'Test Thread',
        body: 'Test Body',
        owner: 'user-123',
        date: '2023-01-01T00:00:00.000Z',
      });

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${threadId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.thread).toBeDefined();
      expect(responseJson.data.thread.id).toEqual(threadId);
      expect(responseJson.data.thread.title).toEqual('Test Thread');
      expect(responseJson.data.thread.body).toEqual('Test Body');
      expect(responseJson.data.thread.date).toEqual('2023-01-01T00:00:00.000Z');
      expect(responseJson.data.thread.username).toEqual('testuser');
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const nonExistentThreadId = 'nonexistent-thread';

      // Action
      const response = await server.inject({
        method: 'GET',
        url: `/threads/${nonExistentThreadId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });
  });
});
