const newPasswordTemplate = (password) => {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Password</title>
      <style>
       .password {
      font-size: 18px;
      font-weight: bold;
      padding: 10px;
      background-color: #f1f1f1;
      border-radius: 4px;
    }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>New Password</h1>
        <p>Dear Admin,</p>
        <p>We have generated a new password for your account. Please use the following password to log in:</p>
        <div class="password">${password}</div>
      </div>
    </body>
    </html>
  `;
  return emailTemplate;
};

module.exports = newPasswordTemplate;
