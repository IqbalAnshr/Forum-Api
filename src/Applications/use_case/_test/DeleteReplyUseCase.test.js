const DeleteReplyUseCase = require('../DeleteReplyUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');

describe('DeleteReplyUseCase', () => {
  it('should orchestrating the delete reply use case action correctly', async () => {
    // Arrange
    const useCaseParams = {
      replyId: 'reply-123',
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    const userId = 'user-123';

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyIsCommentExist = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyIsReplyExist = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = jest.fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.deleteReply = jest.fn()
      .mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    await deleteReplyUseCase.execute(userId, useCaseParams);

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(useCaseParams.threadId);
    expect(mockCommentRepository.verifyIsCommentExist).toBeCalledWith(useCaseParams.commentId);
    expect(mockReplyRepository.verifyIsReplyExist).toBeCalledWith(useCaseParams.replyId);
    expect(mockReplyRepository.verifyReplyOwner).toBeCalledWith(useCaseParams.replyId, userId);
    expect(mockReplyRepository.deleteReply).toBeCalledWith(useCaseParams.replyId);
  });
});
