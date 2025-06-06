class DeleteCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(userId, { threadId, commentId }) {
    await this._threadRepository.verifyIsThreadExist(threadId);
    await this._commentRepository.verifyIsCommentExist(commentId);
    await this._commentRepository.verifyCommentOwner(commentId, userId);
    return this._commentRepository.deleteComment(commentId);
  }
}

module.exports = DeleteCommentUseCase;
