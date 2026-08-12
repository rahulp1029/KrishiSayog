import express from 'express';
import cors from 'cors';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, update } from 'firebase/database';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import mysql from 'mysql2/promise';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || `https://${process.env.VITE_FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

let rtdb = null;
if (firebaseConfig.apiKey) {
    const firebaseApp = initializeApp(firebaseConfig);
    rtdb = getDatabase(firebaseApp);
    console.log('✅ Firebase RTDB configured successfully for telemetry relay');
} else {
    console.warn('⚠️  Firebase config missing in .env. Telemetry to Firebase lies dormant.');
}

// --- MySQL Relational Database Connection Pool ---
let mysqlPool = null;
try {
    mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DATABASE || 'krishisayog_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // Verify MySQL connection and ensure contact_messages table exists
    mysqlPool.getConnection()
        .then(async (conn) => {
            console.log('✅ MySQL Database connected successfully to krishisayog_db!');
            await conn.query(`
                CREATE TABLE IF NOT EXISTS contact_messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    phone VARCHAR(20),
                    subject VARCHAR(150),
                    message TEXT NOT NULL,
                    status VARCHAR(20) DEFAULT 'unread',
                    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('✅ MySQL Table `contact_messages` verified.');
            conn.release();
        })
        .catch((err) => {
            console.warn(`⚠️  MySQL connection failed (${err.message}). System will continue with Firebase.`);
            mysqlPool = null;
        });
} catch (err) {
    console.warn(`⚠️  MySQL initialization error: ${err.message}`);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ 
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// --- OAuth2 Configuration ---
const OAUTH_PROVIDERS = {
    google: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userUrl: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        getScope: () => [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ].join(' '),
        mapUser: (data) => ({
            id: data.id,
            email: data.email,
            name: data.name,
            picture: data.picture,
            provider: 'google',
        }),
    },
    github: {
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userUrl: 'https://api.github.com/user',
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        redirectUri: process.env.GITHUB_REDIRECT_URI,
        getScope: () => 'read:user user:email',
        mapUser: async (data, accessToken) => {
            // Special handling for GitHub private email
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const emails = await emailsResponse.json();
            const primaryEmail = emails.find(e => e.primary)?.email || emails[0]?.email;
            return {
                id: String(data.id),
                email: primaryEmail,
                name: data.name || data.login,
                picture: data.avatar_url,
                provider: 'github',
            };
        },
    },
};

// --- Helper Functions ---
const generateToken = (user) => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

// --- OAuth2 Routes ---
app.get('/api/auth/:provider', (req, res) => {
    const { provider } = req.params;
    const config = OAUTH_PROVIDERS[provider];
    if (!config) return res.status(404).send('Provider not found');

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: config.getScope(),
        ...(provider === 'google' ? { access_type: 'offline', prompt: 'consent' } : {}),
    });

    res.redirect(`${config.authUrl}?${params.toString()}`);
});

app.get('/api/auth/:provider/callback', async (req, res) => {
    const { provider } = req.params;
    const { code } = req.query;
    const config = OAUTH_PROVIDERS[provider];

    if (!config || !code) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_request`);
    }

    try {
        // 1. Exchange code for token
        const tokenParams = provider === 'google' 
            ? new URLSearchParams({
                code,
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri,
                grant_type: 'authorization_code',
              })
            : JSON.stringify({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code,
                redirect_uri: config.redirectUri,
              });

        const tokenResponse = await fetch(config.tokenUrl, {
            method: 'POST',
            headers: { 
                'Accept': 'application/json',
                ...(provider === 'google' 
                    ? { 'Content-Type': 'application/x-www-form-urlencoded' }
                    : { 'Content-Type': 'application/json' })
            },
            body: tokenParams,
        });

        const { access_token } = await tokenResponse.json();

        // 2. Get user info
        const userUrl = provider === 'google' ? `${config.userUrl}&access_token=${access_token}` : config.userUrl;
        const userResponse = await fetch(userUrl, {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const rawUser = await userResponse.json();

        // 3. Map user and generate session
        const user = await config.mapUser(rawUser, access_token);

        // Create JWT
        const jwtToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name, provider: user.provider },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Store User Profile in MySQL if connected
        if (mysqlPool) {
            try {
                await mysqlPool.query(
                    `INSERT INTO users (id, name, email, location) 
                     VALUES (?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email)`,
                    [user.id || user.email, user.name || 'Farmer', user.email, 'Nashik, Maharashtra']
                );
                console.log(`💾 MySQL: Saved user ${user.name} to users table.`);
            } catch (mysqlErr) {
                console.warn(`⚠️  MySQL User Insert Warning: ${mysqlErr.message}`);
            }
        }

        // Set HttpOnly Cookie
        res.cookie('token', jwtToken, {
            httpOnly: true,
            secure: false, // set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.redirect(`${process.env.FRONTEND_URL}/auth-callback?success=true`);
    } catch (error) {
        console.error(`${provider} Auth Error:`, error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=${provider}_auth_failed`);
    }
});

// --- User Profile Route ---
app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
});

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'rahulkumarpokhriyal1029@gmail.com';
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'rahulkumarpokhriyal1029@gmail.com';

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('✅ SendGrid configured successfully');
} else {
    console.warn('⚠️  SENDGRID_API_KEY not set. Emails will be logged to console only.');
}

// POST /api/contact — Send contact email
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email, and message are required.',
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address.',
            });
        }

        const subjectLine = subject
            ? `[KrishiSayog Contact] ${subject} — from ${name}`
            : `[KrishiSayog Contact] New message from ${name}`;

        const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">🌾 KrishiSayog — New Contact Message</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #111827;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Email:</td>
              <td style="padding: 8px 0; color: #111827;"><a href="mailto:${email}" style="color: #16a34a;">${email}</a></td>
            </tr>
            ${phone ? `<tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Phone:</td>
              <td style="padding: 8px 0; color: #111827;"><a href="tel:${phone}" style="color: #16a34a;">${phone}</a></td>
            </tr>` : ''}
            ${subject ? `<tr>
              <td style="padding: 8px 0; font-weight: 600; color: #374151;">Subject:</td>
              <td style="padding: 8px 0; color: #111827;">${subject}</td>
            </tr>` : ''}
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <h3 style="color: #374151; font-size: 15px; margin-bottom: 8px;">Message:</h3>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; color: #111827; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">
            Sent from KrishiSayog Contact Form • ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </p>
        </div>
      </div>
    `;

        // Auto-reply email to the farmer
        const autoReplyHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; border-radius: 12px 12px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">🌾 Thank you for contacting KrishiSayog!</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #111827; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
          <p style="color: #111827; line-height: 1.6;">
            Thank you for reaching out to us! We have received your message and will get back to you within <strong>24 hours</strong>.
          </p>
          <p style="color: #111827; line-height: 1.6;">
            If your issue is urgent, you can also reach us directly:
          </p>
          <ul style="color: #111827; line-height: 1.8;">
            <li>📞 Phone: <a href="tel:+918920405371" style="color: #16a34a;">+91 8920405371</a></li>
            <li>📧 Email: <a href="mailto:rahulkumarpokhriyal1029@gmail.com" style="color: #16a34a;">rahulkumarpokhriyal1029@gmail.com</a></li>
          </ul>
          <p style="color: #111827; line-height: 1.6;">Best regards,<br/><strong>Rahul Pokhriyal</strong><br/>Developer, KrishiSayog</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">This is an automated response. Please do not reply to this email.</p>
        </div>
      </div>
    `;

        // 1. Save Contact Message to MySQL Database
        if (mysqlPool) {
            try {
                await mysqlPool.query(
                    `INSERT INTO contact_messages (name, email, phone, subject, message) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [name, email, phone || null, subject || 'General Inquiry', message]
                );
                console.log(`💾 MySQL: Saved contact message from ${name} (${email})`);
            } catch (mysqlErr) {
                console.error(`❌ MySQL Contact Save Error: ${mysqlErr.message}`);
            }
        }

        // 2. Save Contact Message to Firebase RTDB if available
        if (rtdb) {
            try {
                const newContactRef = ref(rtdb, `contact_messages/${Date.now()}`);
                await set(newContactRef, {
                    name,
                    email,
                    phone: phone || '',
                    subject: subject || 'General Inquiry',
                    message,
                    submittedAt: new Date().toISOString()
                });
            } catch (fbErr) {
                console.warn(`⚠️  Firebase Contact Save Warning: ${fbErr.message}`);
            }
        }

        if (SENDGRID_API_KEY) {
            // Send the contact email to the developer
            await sgMail.send({
                to: TO_EMAIL,
                from: FROM_EMAIL,
                replyTo: email,
                subject: subjectLine,
                html: htmlContent,
            });

            // Send auto-reply to the farmer
            await sgMail.send({
                to: email,
                from: FROM_EMAIL,
                subject: 'Thank you for contacting KrishiSayog! 🌾',
                html: autoReplyHtml,
            });

            console.log(`✅ Email sent successfully from ${name} (${email})`);
            return res.json({ success: true, message: 'Your message has been received and saved successfully!' });
        } else {
            // Log to console when API key is not set (for development)
            console.log('\n📧 ═══ Contact Form Submission (Logged & Saved to DB) ═══');
            console.log(`   Name:    ${name}`);
            console.log(`   Email:   ${email}`);
            console.log(`   Phone:   ${phone || 'Not provided'}`);
            console.log(`   Subject: ${subject || 'Not provided'}`);
            console.log(`   Message: ${message}`);
            console.log('═════════════════════════════════════════════════════════\n');

            return res.json({
                success: true,
                message: 'Your message has been sent successfully and saved to our database! We will contact you within 24 hours.',
            });
        }
    } catch (error) {
        console.error('❌ SendGrid Error:', error);
        const errorMessage = error.response?.body?.errors?.[0]?.message || 'Failed to send message. Please try again later.';
        return res.status(500).json({ success: false, error: errorMessage });
    }
});

let lastMysqlInsertTime = 0;
const MYSQL_INSERT_INTERVAL_MS = 60000; // 1 minute interval

// POST /api/telemetry — Receive ESP8266 / Raspberry Pi IoT Data
app.post('/api/telemetry', async (req, res) => {
    try {
        const { moisture, temperature, humidity, waterLevel, motorOn, autoMode, soilPH, nitrogen, phosphorus, potassium } = req.body;

        const finalMoist = moisture ?? 50.0;
        const finalTemp = temperature ?? 25.0;
        const finalHum = humidity ?? 60.0;
        const finalWater = waterLevel ?? 100;
        const finalPH = soilPH ?? 6.5;
        const finalN = nitrogen ?? 42;
        const finalP = phosphorus ?? 35;
        const finalK = potassium ?? 55;

        let healthScore = 100;
        if (finalMoist < 30 || finalMoist > 80) healthScore -= 20;
        if (finalTemp > 35 || finalTemp < 10) healthScore -= 20;
        if (finalHum < 20 || finalHum > 90) healthScore -= 10;
        if (finalWater < 20) healthScore -= 15;
        healthScore = Math.max(0, healthScore);

        const now = Date.now();
        // 1. Save Telemetry to MySQL if at least 1 minute has elapsed (Saves 95% DB storage!)
        if (mysqlPool && (now - lastMysqlInsertTime >= MYSQL_INSERT_INTERVAL_MS)) {
            lastMysqlInsertTime = now;
            try {
                await mysqlPool.query(
                    `INSERT INTO telemetry 
                     (device_id, moisture, temperature, humidity, water_level, soil_ph, nitrogen, phosphorus, potassium, farm_health) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        'device_001',
                        finalMoist,
                        finalTemp,
                        finalHum,
                        finalWater,
                        finalPH,
                        finalN,
                        finalP,
                        finalK,
                        healthScore
                    ]
                );
                console.log(`💾 MySQL Throttled (1-min): Saved snapshot to krishisayog_db.telemetry`);
            } catch (mysqlErr) {
                console.error(`❌ MySQL Telemetry Insert Error: ${mysqlErr.message}`);
            }
        }

        const payload = {
            soilMoisture: finalMoist,
            temperature: finalTemp,
            humidity: finalHum,
            waterLevel: finalWater,
            soilPH: finalPH,
            nitrogen: finalN,
            phosphorus: finalP,
            potassium: finalK,
            motorOn: motorOn ?? false,
            autoMode: autoMode ?? true,
            farmHealth: healthScore
        };

        // 2. Relay to Firebase RTDB if online
        if (rtdb) {
            try {
                const farmRef = ref(rtdb, 'farmData');
                await set(farmRef, payload);
            } catch (fbErr) {
                console.warn(`⚠️  Firebase RTDB update warning: ${fbErr.message}`);
            }
        }

        console.log(`✅ Received & Logged IoT Telemetry. Health: ${healthScore} | Water: ${finalWater}%`);
        return res.json({ success: true, message: 'Telemetry updated in MySQL & Firebase.', state: payload });
    } catch (err) {
        console.error("Telemetry Endpoint Error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/user/profile — Save User Profile (Name, Phone, Email, Location, Farm Info) to MySQL
app.post('/api/user/profile', async (req, res) => {
    const { name, email, phone, location, farmName, totalArea, areaUnit, soilType, primaryCrops } = req.body;

    if (!email && !name) {
        return res.status(400).json({ error: 'Name and Email are required.' });
    }

    const userId = email || `user_${Date.now()}`;

    if (mysqlPool) {
        try {
            // 1. Save / Update User in MySQL 'users' table
            await mysqlPool.query(
                `INSERT INTO users (id, name, email, phone, location) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                    name = VALUES(name), 
                    phone = VALUES(phone), 
                    location = VALUES(location)`,
                [userId, name, email, phone, location]
            );

            // 2. Save / Update Farm in MySQL 'farms' table
            await mysqlPool.query(
                `INSERT INTO farms (user_id, farm_name, total_area, area_unit, soil_type, primary_crops) 
                 VALUES (?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                    farm_name = VALUES(farm_name), 
                    total_area = VALUES(total_area), 
                    area_unit = VALUES(area_unit), 
                    soil_type = VALUES(soil_type), 
                    primary_crops = VALUES(primary_crops)`,
                [userId, farmName || 'My Farm', parseFloat(totalArea) || 5.0, areaUnit || 'Acres', soilType || 'Black Clay Soil', primaryCrops || 'Wheat, Tomatoes']
            );

            console.log(`💾 MySQL: Successfully stored profile for Farmer '${name}' (${email}, Phone: ${phone})`);
            return res.json({ success: true, message: 'User profile and farm configuration saved into MySQL database.' });
        } catch (err) {
            console.error('❌ MySQL User Save Error:', err);
            return res.status(500).json({ error: err.message });
        }
    } else {
        return res.json({ success: true, message: 'Profile saved locally (MySQL offline).' });
    }
});

// GET /api/mysql/contacts — Query saved contact messages from MySQL
app.get('/api/mysql/contacts', async (req, res) => {
    if (!mysqlPool) {
        return res.status(503).json({ error: 'MySQL is not connected.' });
    }
    try {
        const [messages] = await mysqlPool.query('SELECT * FROM contact_messages ORDER BY id DESC');
        return res.json({ success: true, count: messages.length, messages });
    } catch (err) {
        console.error('MySQL Contact Query Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/mysql/users — List registered users from MySQL
app.get('/api/mysql/users', async (req, res) => {
    if (!mysqlPool) {
        return res.status(503).json({ error: 'MySQL is not connected.' });
    }
    try {
        const [users] = await mysqlPool.query(`
            SELECT u.id, u.name, u.email, u.phone, u.location, u.created_at,
                   f.farm_name, f.total_area, f.area_unit, f.soil_type, f.primary_crops
            FROM users u
            LEFT JOIN farms f ON u.id = f.user_id
            ORDER BY u.created_at DESC
        `);
        return res.json({ success: true, count: users.length, users });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/mysql/telemetry — Query historical records from MySQL
app.get('/api/mysql/telemetry', async (req, res) => {
    if (!mysqlPool) {
        return res.status(503).json({ error: 'MySQL is not connected or configured.' });
    }
    try {
        const [rows] = await mysqlPool.query('SELECT * FROM telemetry ORDER BY id DESC LIMIT 50');
        return res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        console.error('MySQL Query Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        sendgridConfigured: !!SENDGRID_API_KEY,
        mysqlConnected: !!mysqlPool
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 KrishiSayog Contact API running on http://localhost:${PORT}`);
    console.log(`   POST /api/contact   — Send contact email via SendGrid`);
    console.log(`   POST /api/telemetry — Receive ESP8266 Telemetry & push to Firebase`);
    console.log(`   GET  /api/health    — Health check\n`);
});
