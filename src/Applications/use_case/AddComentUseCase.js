const NewComment = require('../../Domains/comments/entities/NewComment');

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(userId, threadId, comment) {
    await this._threadRepository.verifyIsThreadExist(threadId);
    const newComment = new NewComment(comment);
    return this._commentRepository.addComment(userId, threadId, newComment);
  }
}

module.exports = AddCommentUseCase;
