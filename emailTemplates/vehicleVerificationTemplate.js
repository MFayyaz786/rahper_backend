const vehicleVerificationTemplate = (verification_link) => {
  `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vehicle Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
    }
    
    p {
      margin-bottom: 10px;
    }
    
    .verification-link {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007bff;
      color: #fff;
      text-decoration: none;
      border-radius: 4px;
    }
    
    .note {
      font-size: 12px;
      color: #777;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Vehicle Verification</h1>
    <p>Dear Admin,</p>
    <p>A new vehicle is awaiting verification. Please review the details and approve it if appropriate.</p>
    <p>
      To approve this vehicle, please click the following link:<br>
      <a href="${verification_link}" class="verification-link">Approve Vehicle</a>
    </p>
    <p class="note">Note: This link will only be valid for a limited time.</p>
  </div>
</body>
</html>
`;
};

module.exports = vehicleVerificationTemplate;
