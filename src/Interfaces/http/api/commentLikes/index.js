const CommentLikesHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'commentLikes',
  version: '1.0.0',
  register: async (server, { container }) => {
    const commentLikesHandler = new CommentLikesHandler(container);
    server.route(routes(commentLikesHandler));
  },
};
