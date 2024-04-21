exports.courseEnrollmentEmail = (courseName, name) => {
    return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Course Registration Confirmation</title>
        <style>
          body {
            background-color: #ffffff;
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.4;
            color: #333333;
            margin: 0;
            padding: 0;
          }
    
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
          }
    
          .logo {
            max-width: 200px;
            margin-bottom: 20px;
          }
    
          .message {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
    
          .body {
            font-size: 16px;
            margin-bottom: 20px;
          }
    
          .cta {
            display: inline-block;
            padding: 10px 20px;
            background-color: #ffd60a;
            color: #000000;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
          }
    
          .support {
            font-size: 14px;
            color: #999999;
            margin-top: 20px;
          }
    
          .highlight {
            font-weight: bold;
          }
        </style>
      </head>
    
      <body>
        <div class="container">
          <a href="https://codingarrow.com"
            ><img
              class="logo"
              src="https://i.ibb.co/MgJDSyh/Back-Ground.jpg"
              alt="Coding Arrow Logo"
          /></a>
          <div class="message">Course Registration Confirmation</div>
          <div class="body">
            <p>Hi ${name},</p>
            <p>
              You have successfully registered for the course
              <span class="highlight">"${courseName}"</span>. We are excited to have
              you as a student!
            </p>
            <p>
              Please log in to your learning dashboard to access the course
              materials and start your learning journey.
            </p>
            <a class="cta" href="https://codingarrow.com">Go to HomePage</a>
          </div>
          <div class="support">
            If you have any questions or need assistance, please feel free to reach
            out to us at
            <a href="mailto:codingarrow.pvt.ltd@gmail.com"
              >codingarrow.pvt.ltd@gmail.com</a
            >. We are here to help!
          </div>
        </div>
      </body>
    </html>`;
  };