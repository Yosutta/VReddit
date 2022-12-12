import Joi from "joi";

const EditPostSchema = Joi.object({
  title: Joi.string().min(5).max(128).required(),
  content: Joi.string().min(10).max(1024).required(),
}).options({ abortEarly: false });

export default EditPostSchema;
