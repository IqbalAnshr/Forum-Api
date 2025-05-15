const CommentHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'comments',
  version: '1.0.0',
  register: async (server, { container }) => {
    const commentHandler = new CommentHandler(container);
    server.route(routes(commentHandler));
  },
};
