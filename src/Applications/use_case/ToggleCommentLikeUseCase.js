class ToggleCommentLikeUseCase {
  constructor({ threadRepository, commentRepository, commentLikeRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._commentLikeRepository = commentLikeRepository;
  }

  async execute({ threadId, commentId, userId }) {
    await this._threadRepository.verifyIsThreadExist(threadId);
    await this._commentRepository.verifyIsCommentExist(commentId);
    const commentLike = await this._commentLikeRepository.getCommentLike(commentId, userId);
    if (commentLike) {
      await this._commentLikeRepository.deleteCommentLike(commentId, userId);
    } else {
      await this._commentLikeRepository.addCommentLike(commentId, userId);
    }
  }
}

module.exports = ToggleCommentLikeUseCase;
