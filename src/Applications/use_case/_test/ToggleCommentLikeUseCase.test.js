// const CommentLikes = require('../../../Domains/comments/entities/CommentLikes');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentLikeRepository = require('../../../Domains/commentLikes/CommentLikeRepository');
const ToggleCommentLikeUseCase = require('../ToggleCommentLikeUseCase');

describe('ToggleCommentLikeUseCase', () => {
  it('should orchestrating the add comment like action correctly when comment is not liked', async () => {
    // Arrange
    const userId = 'user-123';
    const threadId = 'thread-123';
    const commentId = 'comment-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockCommentLikeRepository = new CommentLikeRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.verifyIsCommentExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.getCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve(undefined, undefined));

    mockCommentLikeRepository.addCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.deleteCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      commentLikeRepository: mockCommentLikeRepository,
    });

    // Action
    await toggleCommentLikeUseCase.execute({
      threadId,
      commentId,
      userId,
    });

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyIsCommentExist).toBeCalledWith(commentId);
    expect(mockCommentLikeRepository.getCommentLike).toBeCalledWith(commentId, userId);
    expect(mockCommentLikeRepository.addCommentLike).toBeCalledWith(commentId, userId);
    expect(mockCommentLikeRepository.deleteCommentLike).not.toBeCalled();
  });

  it('should orchestrating the delete comment like action correctly when comment is liked', async () => {
    // Arrange
    const userId = 'user-123';
    const threadId = 'thread-123';
    const commentId = 'comment-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockCommentLikeRepository = new CommentLikeRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.verifyIsCommentExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.getCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve(commentId, userId));

    mockCommentLikeRepository.addCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.deleteCommentLike = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      commentLikeRepository: mockCommentLikeRepository,
    });

    // Action
    await toggleCommentLikeUseCase.execute({
      threadId,
      commentId,
      userId,
    });

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(threadId);
    expect(mockCommentRepository.verifyIsCommentExist).toBeCalledWith(commentId);
    expect(mockCommentLikeRepository.getCommentLike).toBeCalledWith(commentId, userId);
    expect(mockCommentLikeRepository.addCommentLike).not.toBeCalled();
    expect(mockCommentLikeRepository.deleteCommentLike).toBeCalledWith(commentId, userId);
  });
});
