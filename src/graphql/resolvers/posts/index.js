const { AuthenticationError } = require("apollo-server");

const Post = require("../../../models/Post");
const checkAuth = require("../../../utils/auth");

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getPost(_, { postId }) {
      try {
        const post = await Post.findById(postId);

        if (!post) throw new Error("Post not found");

        return post;
      } catch (err) {
        throw new Error(err);
      }
    }
  },
  Mutation: {
    async createPost(_, { body }, context) {
      const user = checkAuth(context);

      const post = await new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString()
      }).save();

      return post;
    },
    async deletePost(_, { postId }, context) {
      const user = checkAuth(context);

      try {
        const post = await Post.findById(postId);

        if (!post) throw new UserInputError("Comment not found");

        if (user.id !== String(post.user)) {
          throw new AuthenticationError("Action not allowed");
        }
        await post.delete();
        return "Post deleted successfullt";
      } catch (err) {
        throw new Error(err);
      }
    },
    async likePost(_, { postId }, context) {
      const { username } = checkAuth(context);

      try {
        const post = await Post.findById(postId);

        if (!post) throw new UserInputError("Post not found");

        if (post.likes.find(like => like.username === username)) {
          // Unlike it
          post.likes = post.likes.filter(like => like.username !== username);
        } else {
          // Like it
          post.likes.push({
            username,
            createdAt: new Date().toISOString()
          });
        }

        await post.save();
        return post;
      } catch (err) {
        throw new Error(err);
      }
    }
  }
};
