import envConfig from "config";
import { createTransport } from "nodemailer";

export default async function SendmailTransport(content: string) {
  const transpoter = createTransport({
    host: "smtp.gmail.com",
    service: "Gmail",
    auth: {
      user: envConfig.EMAIL_APP_USERNAME,
      pass: envConfig.EMAIL_APP_PASS,
    },
  });

  const message = {
    from: "ADMIN ISCM WEBSITE",
    to: "khoipham.31211027588@st.ueh.edu.vn",
    subject: "YOU HAVE A PORTAL POST TO VIEW!",
    html: content,
  };

  const result = await transpoter.sendMail(message);

  return result;
}
