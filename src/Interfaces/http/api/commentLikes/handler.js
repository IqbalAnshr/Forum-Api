const ToggleCommentLikeUseCase = require('../../../../Applications/use_case/ToggleCommentLikeUseCase');

class CommentLikesHandler {
  constructor(container) {
    this._container = container;

    this.putCommentLikeHandler = this.putCommentLikeHandler.bind(this);
  }

  async putCommentLikeHandler(request, h) {
    const { commentId, threadId } = request.params;
    const { id: userId } = request.auth.credentials;

    const toggleCommentLikeUseCase = this._container.getInstance(ToggleCommentLikeUseCase.name);

    await toggleCommentLikeUseCase.execute({ threadId, commentId, userId });

    const response = h.response({
      status: 'success',
    });
    response.code(200);
    return response;
  }
}

module.exports = CommentLikesHandler;
