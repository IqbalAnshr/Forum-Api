const pool = require('../../database/postgres/pool');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const CommentTableTestHelper = require('../../../../tests/CommentTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');

const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');

const InvariantError = require('../../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('CommentRepositoryPostgres', () => {
  let userId;
  let threadId;
  const fakeIdGenerator = () => '123';

  beforeAll(async () => {
    // Register user
    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'dicoding',
      password: 'secret',
      fullname: 'Dicoding Indonesia',
    });

    // Add thread
    await ThreadTableTestHelper.addThread({
      id: 'thread-123',
      title: 'a thread',
      body: 'a body',
      owner: 'user-123',
    });

    userId = 'user-123';
    threadId = 'thread-123';
  });

  afterEach(async () => {
    await CommentTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await CommentTableTestHelper.cleanTable();
    await ThreadTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment and return added comment correctly', async () => {
      // Arrange
      const newComment = new NewComment({
        content: 'a comment',
      });
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedComment = await commentRepository.addComment(userId, threadId, newComment);

      // Assert
      const comments = await CommentTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: 'a comment',
        owner: userId,
      }));
    });

    it('should throw InvariantError when comment addition fails', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn().mockResolvedValue({ rowCount: 0 }),
      };
      const commentRepository = new CommentRepositoryPostgres(mockPool, fakeIdGenerator);

      // Act & Assert
      await expect(commentRepository.addComment(userId, threadId, new NewComment({
        content: 'a comment',
      }))).rejects.toThrow(InvariantError);
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment correctly', async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: 'comment-123',
        threadId,
        owner: userId,
      });
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await commentRepository.deleteComment('comment-123');

      // Assert
      const comments = await CommentTableTestHelper.findCommentsById('comment-123');
      expect(comments[0].deleted_at).toBeDefined();
      expect(comments[0].deleted_at).not.toBeNull();
    });

    it('should throw InvariantError when comment not found', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(commentRepository.deleteComment('nonexistent-comment'))
        .rejects.toThrow(InvariantError);
    });
  });

  describe('verifyIsCommentExist function', () => {
    it('should not throw NotFoundError when comment exists', async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: 'comment-123',
        threadId,
        owner: userId,
      });
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(commentRepository.verifyIsCommentExist('comment-123'))
        .resolves.not.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(commentRepository.verifyIsCommentExist('nonexistent-comment'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should not throw AuthorizationError when user is the owner', async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: 'comment-123',
        threadId,
        owner: userId,
      });
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(commentRepository.verifyCommentOwner('comment-123', userId))
        .resolves.not.toThrow(AuthorizationError);
    });

    it('should throw AuthorizationError when user is not the owner', async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: 'comment-123',
        threadId,
        owner: userId,
      });
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(commentRepository.verifyCommentOwner('comment-123', 'user-456'))
        .rejects.toThrow(AuthorizationError);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments by thread id correctly', async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: 'comment-123',
        threadId,
        owner: userId,
        content: 'first comment',
        date: '2025-04-24T12:26:22.454Z',
      });

      await CommentTableTestHelper.addComment({
        id: 'comment-456',
        threadId,
        owner: userId,
        content: 'second comment',
        date: '2025-04-24T12:26:26.451Z',
      });

      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const comments = await commentRepository.getCommentsByThreadId(threadId);

      // Assert
      expect(comments).toHaveLength(2);
      expect(comments[0]).toEqual({
        id: 'comment-123',
        username: 'dicoding',
        content: 'first comment',
        date: '2025-04-24T12:26:22.454Z',
        deleted_at: null,
      });
      expect(comments[1]).toEqual({
        id: 'comment-456',
        username: 'dicoding',
        content: 'second comment',
        date: '2025-04-24T12:26:26.451Z',
        deleted_at: null,
      });
    });

    it('should return empty array when no comments found', async () => {
      // Arrange
      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const comments = await commentRepository.getCommentsByThreadId(threadId);

      // Assert
      expect(comments).toEqual([]);
    });

    it('should return comments with correct structure when comments are deleted', async () => {
      // Arrange
      await CommentTableTestHelper.addComment({
        id: 'comment-123',
        threadId,
        owner: userId,
        content: 'deleted comment',
        date: '2025-04-24T12:26:22.454Z',
        deletedAt: '2025-04-24T12:26:22.454Z',
      });

      const commentRepository = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const comments = await commentRepository.getCommentsByThreadId(threadId);

      // Assert
      expect(comments[0]).toEqual({
        id: 'comment-123',
        username: 'dicoding',
        content: 'deleted comment',
        date: '2025-04-24T12:26:22.454Z',
        deleted_at: '2025-04-24T12:26:22.454Z',
      });
    });
  });
});
