const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const CommentTableTestHelper = require('../../../../tests/CommentTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('/comments endpoint', () => {
  let server;
  let accessToken;
  let threadId;

  beforeAll(async () => {
    server = await createServer(container);
    // Create a user and get access token for authentication
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'testuser' });
    const tokenManager = container.getInstance(AuthenticationTokenManager.name);
    accessToken = await tokenManager.createAccessToken({ id: 'user-123', username: 'testuser' });

    // Create a thread for comment testing
    await ThreadTableTestHelper.addThread({
      id: 'thread-123',
      title: 'Test Thread',
      body: 'Test Body',
      owner: 'user-123',
    });
    threadId = 'thread-123';
  });

  afterAll(async () => {
    await ThreadTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await CommentTableTestHelper.cleanTable();
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and persisted comment', async () => {
      // Arrange
      const requestPayload = {
        content: 'This is a test comment',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();

      // Verify the comment is actually in database
      const comments = await CommentTableTestHelper
        .findCommentsById(responseJson.data.addedComment.id);
      expect(comments).toHaveLength(1);
      expect(comments[0].content).toEqual(requestPayload.content);
      expect(comments[0].thread).toEqual(threadId);
      expect(comments[0].owner).toEqual('user-123');
    });

    it('should response 401 when request not authenticated', async () => {
      // Arrange
      const requestPayload = {
        content: 'This is a test comment',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');

      // Verify no comment was added
      const comments = await CommentTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(0);
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const nonExistentThreadId = 'nonexistent-thread';
      const requestPayload = {
        content: 'This is a test comment',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${nonExistentThreadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const invalidPayloads = [
        {}, // missing content
        { unrelated: 'value' }, // missing content
      ];

      await Promise.all(
        invalidPayloads.map(async (requestPayload) => {
          // Action
          const response = await server.inject({
            method: 'POST',
            url: `/threads/${threadId}/comments`,
            payload: requestPayload,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Assert
          const responseJson = JSON.parse(response.payload);
          expect(response.statusCode).toEqual(400);
          expect(responseJson.status).toEqual('fail');
          // Update expected message to match implementation
          expect(responseJson.message).toEqual('tidak dapat membuat comment karena properti yang dibutuhkan tidak ada');
        }),
      );
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const invalidPayloads = [
        { content: 123 }, // invalid content type
        { content: true }, // invalid content type
        { content: ['array'] }, // invalid content type
      ];

      await Promise.all(
        invalidPayloads.map(async (requestPayload) => {
          // Action
          const response = await server.inject({
            method: 'POST',
            url: `/threads/${threadId}/comments`,
            payload: requestPayload,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Assert
          const responseJson = JSON.parse(response.payload);
          expect(response.statusCode).toEqual(400);
          expect(responseJson.status).toEqual('fail');
          expect(responseJson.message).toEqual('tidak dapat membuat comment karena tipe data tidak sesuai');
        }),
      );
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200 and soft delete comment', async () => {
      // Arrange
      const commentId = 'comment-123';
      await CommentTableTestHelper.addComment({
        id: commentId,
        content: 'Test comment',
        threadId,
        owner: 'user-123',
      });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      // Verify comment is soft deleted
      const comments = await CommentTableTestHelper.findCommentsById(commentId);
      expect(comments[0].deleted_at).not.toBeNull();
    });

    it('should response 403 when user is not the comment owner', async () => {
      // Arrange
      const commentId = 'comment-123';
      // First add the other user
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'otheruser' });
      await CommentTableTestHelper.addComment({
        id: commentId,
        content: 'Test comment',
        threadId,
        owner: 'user-456', // different owner
      });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('anda tidak berhak melakukan aksi ini');
    });

    it('should response 404 when comment not found', async () => {
      // Arrange
      const nonExistentCommentId = 'nonexistent-comment';

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${nonExistentCommentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const commentId = 'comment-123';
      const nonExistentThreadId = 'nonexistent-thread';

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${nonExistentThreadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });
  });
});
