import Joi from "joi";

const EditUserInfoSchema = Joi.object({
  username: Joi.string().max(32).min(4).required(),
  firstname: Joi.string().max(32).min(2).required(),
  lastname: Joi.string().max(32).min(2).required(),
  birthdate: Joi.date().less("now").required(),
}).options({ abortEarly: false });

export default EditUserInfoSchema;
