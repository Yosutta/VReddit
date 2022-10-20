import Joi from "joi";

const postSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
})
.options({ abortEarly: false });

export default postSchema;
