const pool = require('../../database/postgres/pool');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const ReplyTableTestHelper = require('../../../../tests/ReplyTableTestHelper');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const CommentTableTestHelper = require('../../../../tests/CommentTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');

const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');

const InvariantError = require('../../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ReplyRepositoryPostgres', () => {
  let userId;
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
    // Add comment
    await CommentTableTestHelper.addComment({
      id: 'comment-123',
      content: 'a comment',
      threadId: 'thread-123',
      owner: 'user-123',
    });

    userId = 'user-123';
  });

  afterEach(async () => {
    await ReplyTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await ReplyTableTestHelper.cleanTable();
    await CommentTableTestHelper.cleanTable();
    await ThreadTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist add reply and return added reply correctly', async () => {
      // Arrange
      const newReply = new NewReply({
        content: 'a reply',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedReply = await replyRepositoryPostgres.addReply('comment-123', 'user-123', newReply);

      // Assert
      const reply = await ReplyTableTestHelper.findReplyById('reply-123');
      expect(reply).toHaveLength(1);
      expect(addedReply).toBeInstanceOf(AddedReply);
      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: newReply.content,
        owner: 'user-123',
      }));
    });

    it('should throw InvariantError when reply addition fails', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn().mockResolvedValue({ rowCount: 0 }),
      };

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(mockPool, fakeIdGenerator);
      const newReply = new NewReply({
        content: 'a reply',
      });

      // Action and Assert
      await expect(replyRepositoryPostgres.addReply('comment-123', 'user-123', newReply)).rejects.toThrow(InvariantError);
    });
  });

  describe('getRepliesByCommentIds function', () => {
    it('should return replies correctly for multiple comment IDs', async () => {
      // Arrange
      // Add second comment
      await CommentTableTestHelper.addComment({
        id: 'comment-124',
        content: 'another comment',
        threadId: 'thread-123',
        owner: 'user-123',
      });

      // Add replies to both comments
      await ReplyTableTestHelper.addReply({
        id: 'reply-123',
        content: 'reply to comment 123',
        commentId: 'comment-123',
        owner: 'user-123',
      });

      await ReplyTableTestHelper.addReply({
        id: 'reply-124',
        content: 'reply to comment 124',
        commentId: 'comment-124',
        owner: 'user-123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentIds(['comment-123', 'comment-124']);

      // Assert
      expect(replies).toHaveLength(2);
      expect(replies).toEqual([
        {
          id: 'reply-123',
          comment: 'comment-123',
          username: 'dicoding',
          content: 'reply to comment 123',
          date: expect.any(String),
          deleted_at: null,
        },
        {
          id: 'reply-124',
          comment: 'comment-124',
          username: 'dicoding',
          content: 'reply to comment 124',
          date: expect.any(String),
          deleted_at: null,
        },
      ]);
    });

    it('should return empty array if no comments have replies', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentIds(['comment-123', 'comment-124']);

      // Assert
      expect(replies).toHaveLength(0);
    });

    it('should return only replies for existing comments', async () => {
      // Arrange
      await ReplyTableTestHelper.addReply({
        id: 'reply-123',
        content: 'a reply',
        commentId: 'comment-123',
        owner: 'user-123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const replies = await replyRepositoryPostgres.getRepliesByCommentIds(['comment-123', 'non-existent-comment']);

      // Assert
      expect(replies).toHaveLength(1);
      expect(replies[0].comment).toBe('comment-123');
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should not throw error if reply owner is the same as user id', async () => {
      // Arrange
      await ReplyTableTestHelper.addReply({ id: 'reply-123', owner: userId });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', userId)).resolves.not.toThrow(Error);
    });

    it('should throw error if reply owner is not the same as user id', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-456')).rejects.toThrow(Error);
    });

    it('should throw error if reply does not exist', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', userId)).rejects.toThrow(Error);
    });
  });

  describe('verifyIsReplyExist function', () => {
    it('should not throw NotFoundError if reply exists', async () => {
      // Arrange
      await ReplyTableTestHelper.addReply({ id: 'reply-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyIsReplyExist('reply-123')).resolves.not.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if reply does not exist', async () => {
      // Arrange
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action and Assert
      await expect(replyRepositoryPostgres.verifyIsReplyExist('does-not-exist')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteReply function', () => {
    it('should delete reply correctly', async () => {
      // Arrange
      await ReplyTableTestHelper.addReply({ id: 'reply-123' });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      await replyRepositoryPostgres.deleteReply('reply-123');

      // Assert
      const replies = await ReplyTableTestHelper.findReplyById('reply-123');
      expect(replies[0].deleted_at).not.toBeNull();
    });

    it('should throw InvariantError when delete fails', async () => {
      const mockPool = {
        query: jest.fn().mockResolvedValue({ rowCount: 0 }),
      };
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(mockPool, fakeIdGenerator);

      await expect(replyRepositoryPostgres.deleteReply('reply-123'))
        .rejects.toThrow(InvariantError);
    });
  });
});
