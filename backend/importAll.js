const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config();
const path = require('path');
const Account = require('./models/Account');

const importAllData = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected Successfully!\n");

        const filePath = path.join(__dirname, 'INFO.xlsx');
        const workbook = XLSX.readFile(filePath);
        
        let totalImported = 0;

        for (let sheetName of workbook.SheetNames) {
            // Gmail আগেই ইমপোর্ট করা, তাই বাদ দেওয়া হলো
            if (sheetName.toLowerCase() === 'gmail') continue; 

            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); 
            
            let headerRowIndex = -1;
            
            // হেডার খোঁজা
            for (let i = 0; i < rows.length; i++) {
                if (!rows[i] || !Array.isArray(rows[i])) continue;
                const rowStr = rows[i].join(' ').toLowerCase();
                if (rowStr.includes('email') || rowStr.includes('pass')) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                console.log(`Skipping '${sheetName}': Kono Email/Password column pawa jayni.`);
                continue;
            }

            // FIX: ফাঁকা কলাম (empty slots) গুলো সরাতে স্প্রেড অপারেটর [...array] ব্যবহার করা হয়েছে
            const headers = [...rows[headerRowIndex]].map(h => h ? String(h).toLowerCase().trim() : '');
            
            // FIX: h && যুক্ত করা হয়েছে যাতে undefined থাকলে কোড ক্র্যাশ না করে
            const emailIdx = headers.findIndex(h => h && (h.includes('email') || h === 'user' || h === 'mobile' || h.includes('mail')));
            const passIdx = headers.findIndex(h => h && (h.includes('pass') || h === 'password'));
            const serviceIdx = headers.findIndex(h => h && (h.includes('web name') || h.includes('website') || h.includes('platform') || h.includes('academic name')));

            const results = [];

            for (let i = headerRowIndex + 1; i < rows.length; i++) {
                const row = [...rows[i]]; 
                if (!row || row.length === 0) continue;

                const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : '';
                const password = passIdx !== -1 && row[passIdx] ? String(row[passIdx]).trim() : '';
                const service = serviceIdx !== -1 && row[serviceIdx] ? String(row[serviceIdx]).trim() : sheetName;

                // OTP বা N/A লেখা পাসওয়ার্ডগুলো সেভ না করার লজিক
                if ((email || password) && password.toUpperCase() !== 'OTP' && password.toUpperCase() !== 'N/A') { 
                    results.push({
                        category: sheetName,
                        service: service,
                        email: email,
                        password: password,
                    });
                }
            }

            if (results.length > 0) {
                console.log(`-> '${sheetName}' sheet theke ${results.length} ti data import kora hochhe...`);
                await Account.insertMany(results, { ordered: false });
                totalImported += results.length;
            } else {
                console.log(`-> '${sheetName}' e kono valid data pawa jayni.`);
            }
        }

        console.log(`\n=== SUCCESS ===`);
        console.log(`Mot ${totalImported} ti notun account database-e save hoyeche!`);
        await mongoose.connection.close();
        process.exit();
    } catch (err) {
        console.error("Migration Error:", err.message);
        process.exit(1);
    }
};

importAllData();