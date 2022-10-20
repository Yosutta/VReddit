import Joi from "joi";

const ChangePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required(),
  newPassword2: Joi.string().required(),
}).options({ abortEarly: false });

export default ChangePasswordSchema;
