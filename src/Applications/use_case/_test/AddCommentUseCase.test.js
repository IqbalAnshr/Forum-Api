const NewComment = require('../../../Domains/comments/entities/NewComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const AddCommentUseCase = require('../AddComentUseCase');

describe('AddCommentUseCase', () => {
  it('should orchestrating the add comment action correctly', async () => {
    // Arrange
    const useCasePayload = {
      content: 'a comment',
    };
    const threadId = 'thread-123';
    const userId = 'user-123';

    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyIsThreadExist = jest.fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.addComment = jest.fn()
      .mockImplementation(() => Promise.resolve(
        new AddedComment({
          id: 'comment-123',
          content: useCasePayload.content,
          owner: userId,
        }),
      ));

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    // Action
    const addedComment = await addCommentUseCase.execute(userId, threadId, useCasePayload);

    // Assert
    expect(mockThreadRepository.verifyIsThreadExist).toBeCalledWith(threadId);
    expect(mockCommentRepository.addComment).toBeCalledWith(
      userId,
      threadId,
      new NewComment(useCasePayload),
    );
    expect(addedComment).toStrictEqual(new AddedComment({
      id: 'comment-123',
      content: useCasePayload.content,
      owner: userId,
    }));
  });
});
