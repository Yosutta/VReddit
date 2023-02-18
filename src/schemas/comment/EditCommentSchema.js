import Joi from "joi";

const EditCommentSchema = Joi.object({
  commentText: Joi.string().max(256).required(),
}).options({ abortEarly: false });

export default EditCommentSchema;
