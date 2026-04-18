import mailService from "./mail.service.js";

async function testSmtp(req, res, next) {
  try {
    const result = await mailService.verifyConnection();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function sendSimpleMail(req, res, next) {
  try {
    const result = await mailService.sendMail(req.body);
    res.status(200).json({
      message: "Email envoyé avec succès",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function sendWelcome(req, res, next) {
  try {
    const { to, firstName } = req.body;
    const result = await mailService.sendWelcomeEmail(to, firstName);
    res.status(200).json({
      message: "Email de bienvenue envoyé",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  testSmtp,
  sendSimpleMail,
  sendWelcome
};