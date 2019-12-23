const { UserInputError, AuthenticationError } = require("apollo-server");
const Yup = require("yup");
const Post = require("../../../models/Post");
const checkAuth = require("../../../utils/auth");

module.exports = {
  Mutation: {
    async createComment(_, { postId, body }, context) {
      const { username } = checkAuth(context);

      if (body.trim() === "") {
        throw new UserInputError("Empty comment", {
          errors: {
            body: "Comment body must have a content"
          }
        });
      }

      const post = await Post.findById(postId);

      if (!post) throw new UserInputError("Post not found");

      post.comments.unshift({
        body,
        username,
        createdAt: new Date().toISOString()
      });

      await post.save();

      return post;
    },
    async deleteComment(_, { postId, commentId }, context) {
      const { username } = checkAuth(context);

      if (!postId) {
        throw new UserInputError("Empty post id", {
          errors: {
            postId: "PostId must be provided"
          }
        });
      }

      if (!commentId) {
        throw new UserInputError("Empty comment id", {
          errors: {
            commentId: "CommentId must be provided"
          }
        });
      }

      const post = await Post.findById(postId);

      if (!post) throw new UserInputError("Post not found");

      const commentIndex = post.comments.findIndex(
        comment => comment.id === commentId
      );

      if (commentIndex < 0) throw new UserInputError("Comment not found");

      if (post.comments[commentIndex].username !== username) {
        throw new AuthenticationError("Action not allowed");
      }

      post.comments.splice(commentIndex, 1);

      await post.save();
      return post;
    }
  }
};
