const pool = require('../../database/postgres/pool');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const CommentTableTestHelper = require('../../../../tests/CommentTableTestHelper');
const CommentLikeTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const container = require('../../container');
const createServer = require('../createServer');
const AuthenticationTokenManager = require('../../../Applications/security/AuthenticationTokenManager');

describe('/threads/{threadId}/comments/{commentId}/likes endpoint', () => {
  let server;
  let accessToken;
  let threadId;
  let commentId;

  beforeAll(async () => {
    server = await createServer(container);
    await UsersTableTestHelper.addUser({ id: 'user-123', username: 'testuser' });
    const tokenManager = container.getInstance(AuthenticationTokenManager.name);
    accessToken = await tokenManager.createAccessToken({ id: 'user-123', username: 'testuser' });

    await ThreadTableTestHelper.addThread({
      id: 'thread-123',
      title: 'Test Thread',
      body: 'Test Body',
      owner: 'user-123',
    });
    threadId = 'thread-123';

    await CommentTableTestHelper.addComment({
      id: 'comment-123',
      content: 'Test comment',
      threadId,
      owner: 'user-123',
    });
    commentId = 'comment-123';
  });

  afterAll(async () => {
    await CommentLikeTableTestHelper.cleanTable();
    await CommentTableTestHelper.cleanTable();
    await ThreadTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  afterEach(async () => {
    await CommentLikeTableTestHelper.cleanTable();
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and like comment when not liked before', async () => {
      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      // Verify the like is in database
      const likes = await CommentLikeTableTestHelper.findCommentLikeByUserAndComment('user-123', commentId);
      expect(likes).toHaveLength(1);
      expect(likes[0].comment_id).toEqual(commentId);
      expect(likes[0].user_id).toEqual('user-123');
    });

    it('should response 200 and unlike comment when already liked', async () => {
      // Arrange - pastikan sudah like lewat endpoint
      await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Action - like lagi akan menjadi unlike
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');

      // Verify the like is removed from database
      const likes = await CommentLikeTableTestHelper.findCommentLikeByUserAndComment('user-123', commentId);
      expect(likes).toHaveLength(0);
    });

    it('should response 401 when request not authenticated', async () => {
      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${commentId}/likes`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const nonExistentThreadId = 'nonexistent-thread';

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${nonExistentThreadId}/comments/${commentId}/likes`,
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

      // Action
      const response = await server.inject({
        method: 'PUT',
        url: `/threads/${threadId}/comments/${nonExistentCommentId}/likes`,
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
