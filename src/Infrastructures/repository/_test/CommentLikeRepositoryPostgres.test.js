const pool = require('../../database/postgres/pool');
const CommentLikeRepositoryPostgres = require('../CommentLikeRepositoryPostgres');
const CommentLikeTableTestHelper = require('../../../../tests/CommentLikesTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const CommentTableTestHelper = require('../../../../tests/CommentTableTestHelper');

const InvariantError = require('../../../Commons/exceptions/InvariantError');

describe('CommentLikeRepositoryPostgres', () => {
  let userId;
  let commentId;
  const fakeIdGenerator = () => '123';

  beforeAll(async () => {
    // Setup dependencies
    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'dicoding',
    });
    await ThreadTableTestHelper.addThread({
      id: 'thread-123',
      owner: 'user-123',
    });
    await CommentTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    userId = 'user-123';
    commentId = 'comment-123';
  });

  afterEach(async () => {
    await CommentLikeTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await CommentLikeTableTestHelper.cleanTable();
    await CommentTableTestHelper.cleanTable();
    await ThreadTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addCommentLike function', () => {
    it('should persist comment like and return added like correctly', async () => {
      // Arrange
      const repository = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedLike = await repository.addCommentLike(commentId, userId);

      // Assert
      const likes = await CommentLikeTableTestHelper.findCommentLikeById('like-123');
      expect(likes).toHaveLength(1);
      expect(addedLike).toEqual({
        id: 'like-123',
        comment_id: commentId,
        user_id: userId,
      });
    });

    it('should throw InvariantError when comment like addition fails', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn().mockResolvedValue({ rowCount: 0 }),
      };
      const repository = new CommentLikeRepositoryPostgres(mockPool, fakeIdGenerator);

      // Act & Assert
      await expect(repository.addCommentLike(commentId, userId))
        .rejects.toThrow(InvariantError);
    });
  });

  describe('deleteCommentLike function', () => {
    it('should delete comment like correctly', async () => {
      // Arrange
      await CommentLikeTableTestHelper.addCommentLike({
        id: 'like-123',
        commentId,
        userId,
      });
      const repository = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await repository.deleteCommentLike(commentId, userId);

      // Assert
      const likes = await CommentLikeTableTestHelper.findCommentLikeById('like-123');
      expect(likes).toHaveLength(0);
    });

    it('should throw InvariantError when comment like not found', async () => {
      // Arrange
      const repository = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      // Act & Assert
      await expect(repository.deleteCommentLike('nonexistent-comment', userId))
        .rejects.toThrow(InvariantError);
    });
  });

  describe('getCommentLike function', () => {
    it('should return comment like when found', async () => {
      // Arrange
      await CommentLikeTableTestHelper.addCommentLike({
        id: 'like-123',
        commentId,
        userId,
      });
      const repository = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const like = await repository.getCommentLike(commentId, userId);

      // Assert
      expect(like).toEqual({
        id: 'like-123',
        comment_id: commentId,
        user_id: userId,
      });
    });

    it('should return undefined when comment like not found', async () => {
      // Arrange
      const repository = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const like = await repository.getCommentLike('nonexistent-comment', userId);

      // Assert
      expect(like).toBeUndefined();
    });
  });
});
