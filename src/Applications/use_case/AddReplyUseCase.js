const NewReply = require('../../Domains/replies/entities/NewReply');

class AddReplyUseCase {
  constructor({ replyRepository, threadRepository, commentRepository }) {
    this._replyRepository = replyRepository;
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(userId, paramsPayload, useCasePayload) {
    const { threadId, commentId } = paramsPayload;
    await this._threadRepository.verifyIsThreadExist(threadId);
    await this._commentRepository.verifyIsCommentExist(commentId);
    const newReply = new NewReply(useCasePayload);
    return this._replyRepository.addReply(commentId, userId, newReply);
  }
}

module.exports = AddReplyUseCase;
