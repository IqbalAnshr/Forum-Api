class DeleteReplyUseCase {
  constructor({
    replyRepository,
    threadRepository,
    commentRepository,
  }) {
    this._replyRepository = replyRepository;
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(userId, { threadId, commentId, replyId }) {
    await this._threadRepository.verifyIsThreadExist(threadId);
    await this._commentRepository.verifyIsCommentExist(commentId);
    await this._replyRepository.verifyIsReplyExist(replyId);
    await this._replyRepository.verifyReplyOwner(replyId, userId);
    return this._replyRepository.deleteReply(replyId);
  }
}

module.exports = DeleteReplyUseCase;
