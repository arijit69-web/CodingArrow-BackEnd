exports.passwordResetTemplate = (name,url) => {
    return `<!DOCTYPE html>
    <html>
    
    <head>
        <meta charset="UTF-8">
        <title>Password Reset</title>
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
                border-radius: 100px;
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
            <a href="https://codingarrow.com/"><img class="logo"
                    src="https://i.ibb.co/MgJDSyh/Back-Ground.jpg" alt="Coding Arrow Logo"></a>
            <div class="message">Password Reset</div>
            <div class="body">
            <p>Hi ${name},</p>
            We have received a request to reset your password for your account. If you did not make this request, you can safely ignore this email.
            To reset your password, please click on the following link:
            <a href=${url}>Reset Password</a>
            If clicking the link above does not work, you can copy and paste the following URL into your browser:
            ${url}
            This link is valid for the next 5 mins. After that, you will need to request another password reset.
            </div>
            <div class="support">If you have any questions or need further assistance, please feel free to reach out to us at
                <a href="mailto:codingarrow.pvt.ltd@gmail.com">codingarrow.pvt.ltd@gmail.com</a>. We are here to help!
            </div>
        </div>
    </body>
    
    </html>`;
};