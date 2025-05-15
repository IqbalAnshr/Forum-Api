const NewReply = require('../../../Domains/replies/entities/NewReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const AddReplyUseCase = require('../AddReplyUseCase');

describe('a AddReplyUseCase', () => {
  it('should orchestrating the add reply action correctly', async () => {
    // Arrange
    const payload = {
      content: 'reply content',
    };

    const paramsPayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    const userId = 'user-123';

    const mockReplyRepository = new ReplyRepository();
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.verifyIsCommentExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockReplyRepository.addReply = jest.fn()
      .mockImplementation(() => Promise.resolve(
        new AddedReply({
          id: 'reply-123',
          content: payload.content,
          owner: userId,
        }),
      ));

    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockReplyRepository,
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
    });

    // Action
    const addedReply = await addReplyUseCase.execute(userId, paramsPayload, payload);

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(paramsPayload.threadId);
    expect(mockCommentRepository.verifyIsCommentExist).toBeCalledWith(paramsPayload.commentId);
    expect(mockReplyRepository.addReply).toBeCalledWith(
      paramsPayload.commentId,
      userId,
      new NewReply(payload),
    );
    expect(addedReply).toStrictEqual(new AddedReply({
      id: 'reply-123',
      content: payload.content,
      owner: userId,
    }));
  });
});
