import Joi from "joi";

const SignUpUserSchema = Joi.object({
  email: Joi.string().email().max(64).min(7).required(),
  password: Joi.string().max(20).min(5).required(),
  username: Joi.string().max(32).min(4).required(),
  firstname: Joi.string().max(16).min(2).required(),
  lastname: Joi.string().max(16).min(2).required(),
  birthdate: Joi.date().less("now").required(),
}).options({ abortEarly: false });

export default SignUpUserSchema;
