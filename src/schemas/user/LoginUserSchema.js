import Joi from "joi";

const LoginUserSchema = Joi.object({
  email: Joi.string().email().max(64).required(),
  password: Joi.string().max(20).min(5).required(),
}).options({ abortEarly: false });

export default LoginUserSchema;
