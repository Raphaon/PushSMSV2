export default class AppService {

    static sendEmail(to, subject, body) {
        // Simulate email sending
        console.log(`Email sent to ${to} with subject "${subject}" and body: ${body}`);
        return true; // Simulate successful email sending
    }


}