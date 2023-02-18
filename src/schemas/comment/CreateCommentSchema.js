import Joi from "joi";

const CreateCommentSchema = Joi.object({
  commentText: Joi.string().max(256).required(),
}).options({ abortEarly: false });

export default CreateCommentSchema;
