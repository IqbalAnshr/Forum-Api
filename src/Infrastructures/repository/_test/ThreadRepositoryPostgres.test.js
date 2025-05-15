const pool = require('../../database/postgres/pool');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const ThreadTableTestHelper = require('../../../../tests/ThreadTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');

const NewThread = require('../../../Domains/threads/entities/NewThread');
const AddedThread = require('../../../Domains/threads/entities/AddedThread');

const InvariantError = require('../../../Commons/exceptions/InvariantError');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('ThreadRepositoryPostgres', () => {
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
    userId = 'user-123';
  });

  afterEach(async () => {
    await ThreadTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await ThreadTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      // Arrange
      const newThread = new NewThread({
        title: 'Thread Dicoding',
        body: 'Ini isi dari thread',
      });
      const threadRepository = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const addedThread = await threadRepository.addThread(userId, newThread);

      // Assert
      const threads = await ThreadTableTestHelper.findThreadsById('thread-123');
      expect(threads).toHaveLength(1);
      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: 'Thread Dicoding',
        body: 'Ini isi dari thread',
        owner: userId,
      }));
    });

    it('should throw InvariantError when thread addition fails', async () => {
      // Arrange
      const mockPool = {
        query: jest.fn().mockResolvedValue({ rowCount: 0 }),
      };
      const threadRepository = new ThreadRepositoryPostgres(mockPool, fakeIdGenerator);
      const newThread = new NewThread({
        title: 'Thread Dicoding',
        body: 'Ini isi dari thread',
      });

      // Act & Assert
      await expect(threadRepository.addThread(userId, newThread))
        .rejects.toThrow(InvariantError);
    });
  });

  describe('verifyIsThreadExist function', () => {
    it('should not throw NotFoundError when thread exists', async () => {
      // Arrange
      await ThreadTableTestHelper.addThread({
        id: 'thread-123',
        owner: userId,
      });
      const threadRepository = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(threadRepository.verifyIsThreadExist('thread-123'))
        .resolves.not.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when thread does not exist', async () => {
      // Arrange
      const threadRepository = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(threadRepository.verifyIsThreadExist('nonexistent-thread'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getThreadById function', () => {
    it('should return thread details correctly', async () => {
      // Arrange
      await ThreadTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Thread Dicoding',
        body: 'Ini isi dari thread',
        owner: userId,
        date: '2025-04-24T12:26:22.454Z',
      });
      const threadRepository = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action
      const thread = await threadRepository.getThreadById('thread-123');

      // Assert
      expect(thread).toStrictEqual({
        id: 'thread-123',
        title: 'Thread Dicoding',
        body: 'Ini isi dari thread',
        date: '2025-04-24T12:26:22.454Z',
        username: 'dicoding',
      });
    });

    it('should throw NotFoundError when thread does not exist', async () => {
      // Arrange
      const threadRepository = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      // Action & Assert
      await expect(threadRepository.getThreadById('nonexistent-thread'))
        .rejects.toThrow(NotFoundError);
    });
  });
});
