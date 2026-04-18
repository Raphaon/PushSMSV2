import Joi from "joi";
 
 const sendMailSchema = Joi.object({
  to: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email()).min(1)
  ).required(),
  cc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional(),
  bcc: Joi.alternatives().try(
    Joi.string().email(),
    Joi.array().items(Joi.string().email())
  ).optional(),
  subject: Joi.string().min(1).max(255).required(),
  text: Joi.string().allow("", null),
  html: Joi.string().allow("", null),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      path: Joi.string().required()
    })
  ).optional()
}).or("text", "html");

const sendWelcomeSchema = Joi.object({
  to: Joi.string().email().required(),
  firstName: Joi.string().min(2).max(80).required()
});


export default sendMailSchema;
