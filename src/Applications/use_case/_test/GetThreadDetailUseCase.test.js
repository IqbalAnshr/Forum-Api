const DetailedThread = require('../../../Domains/threads/entities/DetailedThread');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DetailedComment = require('../../../Domains/comments/entities/DetailedComment');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const DetailedReply = require('../../../Domains/replies/entities/DetailedReply');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const GetThreadDetailUseCase = require('../GetThreadDetailUseCase');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');

describe('GetThreadDetailUseCase', () => {
  it('should orchestrate the get thread detail use case action correctly', async () => {
    // Arrange
    const threadPayload = {
      id: 'thread-123',
      title: 'dicoding',
      body: 'dicoding',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    const commentPayload = [
      {
        id: 'comment-123',
        username: 'dicoding',
        content: 'dicoding',
        date: '2021-08-08T07:19:09.775Z',
        deleted_at: null,
      },
      {
        id: 'comment-456',
        username: 'dicoding',
        content: 'dicoding',
        date: '2021-08-08T07:19:09.775Z',
        deleted_at: '2021-08-08T07:19:09.775Z',
      },
    ];

    const replyPayload = [
      {
        id: 'reply-123',
        content: 'this is a reply',
        date: '2021-08-08T08:19:09.775Z',
        username: 'userA',
        deleted_at: null,
        comment: 'comment-123', // Added comment reference
      },
      {
        id: 'reply-456',
        content: 'this is another reply',
        date: '2021-08-08T09:19:09.775Z',
        username: 'userB',
        deleted_at: '2021-08-08T09:19:09.775Z',
        comment: 'comment-123', // Added comment reference
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.getThreadById = jest.fn()
      .mockImplementation(() => Promise.resolve(threadPayload));
    mockCommentRepository.getCommentsByThreadId = jest.fn()
      .mockImplementation(() => Promise.resolve(commentPayload));
    mockReplyRepository.getRepliesByCommentIds = jest.fn()
      .mockImplementation(() => Promise.resolve(replyPayload));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(threadPayload.id);

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(threadPayload.id);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadPayload.id);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadPayload.id);
    expect(mockReplyRepository.getRepliesByCommentIds).toBeCalledWith(['comment-123', 'comment-456']);

    expect(threadDetail).toStrictEqual(new DetailedThread({
      ...threadPayload,
      comments: [
        new DetailedComment({
          ...commentPayload[0],
          replies: [
            new DetailedReply(replyPayload[0]),
            new DetailedReply(replyPayload[1]),
          ],
        }),
        new DetailedComment({
          ...commentPayload[1],
          replies: [],
        }),
      ],
    }));
  });

  it('should return empty array when no comments exist', async () => {
    // Arrange
    const threadPayload = {
      id: 'thread-123',
      title: 'dicoding',
      body: 'dicoding',
      date: '2021-08-08T07:19:09.775Z',
      username: 'dicoding',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn(() => Promise.resolve());
    mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve(threadPayload));
    mockCommentRepository.getCommentsByThreadId = jest.fn(() => Promise.resolve([]));
    mockReplyRepository.getRepliesByCommentIds = jest.fn(() => Promise.resolve([]));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const threadDetail = await getThreadDetailUseCase.execute(threadPayload.id);

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(threadPayload.id);
    expect(mockThreadRepository.getThreadById).toBeCalledWith(threadPayload.id);
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(threadPayload.id);
    expect(mockReplyRepository.getRepliesByCommentIds).toBeCalledWith([]);
    expect(threadDetail.comments).toEqual([]);
  });

  it('should throw error when thread not found', async () => {
    // Arrange
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn(() => Promise.reject(new NotFoundError('thread tidak ditemukan')));
    mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve());
    mockCommentRepository.getCommentsByThreadId = jest.fn(() => Promise.resolve());
    mockReplyRepository.getRepliesByCommentIds = jest.fn(() => Promise.resolve());

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Act & Assert
    await expect(getThreadDetailUseCase.execute('invalid-thread'))
      .rejects.toThrow(NotFoundError);
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith('invalid-thread');
    expect(mockThreadRepository.getThreadById).not.toHaveBeenCalled();
    expect(mockCommentRepository.getCommentsByThreadId).not.toHaveBeenCalled();
    expect(mockReplyRepository.getRepliesByCommentIds).not.toHaveBeenCalled();
  });
});
