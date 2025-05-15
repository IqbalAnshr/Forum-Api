const AddReplyUseCase = require('../../../../Applications/use_case/AddReplyUseCase');
const DeleteReplyUseCase = require('../../../../Applications/use_case/DeleteReplyUseCase');

class ReplyHandler {
  constructor(container) {
    this._container = container;

    this.postReplyHandler = this.postReplyHandler.bind(this);
    this.deleteReplyHandler = this.deleteReplyHandler.bind(this);
  }

  async postReplyHandler(request, h) {
    const { id: userId } = request.auth.credentials;

    const addThreadUseCase = this._container.getInstance(AddReplyUseCase.name);

    const addedReply = await addThreadUseCase.execute(userId, request.params, request.payload);

    const response = h.response({
      status: 'success',
      data: {
        addedReply,
      },
    });
    response.code(201);
    return response;
  }

  async deleteReplyHandler(request, h) {
    const { id: userId } = request.auth.credentials;

    const deleteReplyUseCase = this._container.getInstance(DeleteReplyUseCase.name);

    await deleteReplyUseCase.execute(userId, request.params);

    const response = h.response({
      status: 'success',
      message: 'Balasan berhasil dihapus',
    });
    response.code(200);
    return response;
  }
}

module.exports = ReplyHandler;
