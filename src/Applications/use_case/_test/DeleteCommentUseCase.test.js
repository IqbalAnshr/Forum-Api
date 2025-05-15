const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const DeleteCommentUseCase = require('../DeleteCommentUseCase');

describe('DeleteCommentUseCase', () => {
  it('should orchestrating the delete comment action correctly', async () => {
    // Arrange
    const params = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    const userId = 'user-123';

    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyIsCommentExist = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentOwner = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.deleteComment = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    await deleteCommentUseCase.execute(userId, params);

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(params.threadId);
    expect(mockCommentRepository.verifyIsCommentExist).toBeCalledWith(params.commentId);
    expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith(params.commentId, userId);
    expect(mockCommentRepository.deleteComment).toBeCalledWith(params.commentId);
  });
});
