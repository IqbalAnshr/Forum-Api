const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const CommentTableTestHelper = require('../../../../tests/CommentTableTestHelper');
const ReplyTableTestHelper = require('../../../../tests/ReplyTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('/replies endpoint', () => {
  let server;
  let accessToken;
  let threadId;
  let commentId;

  beforeAll(async () => {
    server = await createServer(container);
    // Create a user and get access token for authentication
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'testuser' });
    const tokenManager = container.getInstance(AuthenticationTokenManager.name);
    accessToken = await tokenManager.createAccessToken({ id: 'user-123', username: 'testuser' });

    // Create a thread and comment for reply testing
    await ThreadTableTestHelper.addThread({
      id: 'thread-123',
      title: 'Test Thread',
      body: 'Test Body',
      owner: 'user-123',
    });
    threadId = 'thread-123';

    await CommentTableTestHelper.addComment({
      id: 'comment-123',
      threadId,
      owner: 'user-123',
    });
    commentId = 'comment-123';
  });

  afterAll(async () => {
    await ThreadTableTestHelper.cleanTable();
    await CommentTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await ReplyTableTestHelper.cleanTable();
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 and persisted reply', async () => {
      // Arrange
      const requestPayload = {
        content: 'This is a test reply',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedReply).toBeDefined();

      // Verify the reply is actually in database
      const replies = await ReplyTableTestHelper.findReplyById(responseJson.data.addedReply.id);
      expect(replies).toHaveLength(1);
      expect(replies[0].content).toEqual(requestPayload.content);
      expect(replies[0].comment).toEqual(commentId);
      expect(replies[0].owner).toEqual('user-123');
    });

    it('should response 401 when request not authenticated', async () => {
      // Arrange
      const requestPayload = {
        content: 'This is a test reply',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');

      // Verify no reply was added
      const replies = await ReplyTableTestHelper.findReplyById('reply-123');
      expect(replies).toHaveLength(0);
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const nonExistentThreadId = 'nonexistent-thread';
      const requestPayload = {
        content: 'This is a test reply',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${nonExistentThreadId}/comments/${commentId}/replies`,
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

    it('should response 404 when comment not found', async () => {
      // Arrange
      const nonExistentCommentId = 'nonexistent-comment';
      const requestPayload = {
        content: 'This is a test reply',
      };

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${nonExistentCommentId}/replies`,
        payload: requestPayload,
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
            url: `/threads/${threadId}/comments/${commentId}/replies`,
            payload: requestPayload,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Assert
          const responseJson = JSON.parse(response.payload);
          expect(response.statusCode).toEqual(400);
          expect(responseJson.status).toEqual('fail');
          expect(responseJson.message).toEqual('tidak dapat membuat reply karena properti yang dibutuhkan tidak ada');
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
            url: `/threads/${threadId}/comments/${commentId}/replies`,
            payload: requestPayload,
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          // Assert
          const responseJson = JSON.parse(response.payload);
          expect(response.statusCode).toEqual(400);
          expect(responseJson.status).toEqual('fail');
          expect(responseJson.message).toEqual('tidak dapat membuat reply karena tipe data tidak sesuai');
        }),
      );
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should response 200 and soft delete reply', async () => {
      // Arrange
      const replyId = 'reply-123';
      await ReplyTableTestHelper.addReply({
        id: replyId,
        content: 'Test reply',
        commentId,
        owner: 'user-123',
      });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      // Verify reply is soft deleted
      const replies = await ReplyTableTestHelper.findReplyById(replyId);
      expect(replies[0].deleted_at).not.toBeNull();
    });

    it('should response 403 when user is not the reply owner', async () => {
      // Arrange
      const replyId = 'reply-123';
      // First add the other user
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'otheruser' });
      await ReplyTableTestHelper.addReply({
        id: replyId,
        content: 'Test reply',
        commentId,
        owner: 'user-456', // different owner
      });

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
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

    it('should response 404 when reply not found', async () => {
      // Arrange
      const nonExistentReplyId = 'nonexistent-reply';

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${nonExistentReplyId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('balasan tidak ditemukan');
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const replyId = 'reply-123';
      const nonExistentThreadId = 'nonexistent-thread';

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${nonExistentThreadId}/comments/${commentId}/replies/${replyId}`,
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

    it('should response 404 when comment not found', async () => {
      // Arrange
      const replyId = 'reply-123';
      const nonExistentCommentId = 'nonexistent-comment';

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${nonExistentCommentId}/replies/${replyId}`,
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
  });
});
