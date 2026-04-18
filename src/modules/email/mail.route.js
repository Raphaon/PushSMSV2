import express from "express";
import controller from "./mail.controller.js";
import {sendMailSchema, sendWelcomeSchema} from "./mail.validation.js";
import validate from "../../modules/email/mail.validation.js";


const router = express.Router();

router.get("/test-smtp", controller.testSmtp);
router.post("/send", validate(sendMailSchema), controller.sendSimpleMail);
router.post("/send-welcome", validate(sendWelcomeSchema), controller.sendWelcome);

module.exports = router;