const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config();
const path = require('path');
const Account = require('./models/Account');

const importExcelData = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connected Successfully!");

        const filePath = path.join(__dirname, 'INFO.xlsx');
        const workbook = XLSX.readFile(filePath);
        
        // Gmail sheet theke data neya
        const sheetName = 'Gmail'; 
        const worksheet = workbook.Sheets[sheetName];
        
        // range: 4 (mane prothom 4 row skip kora)
        const data = XLSX.utils.sheet_to_json(worksheet, { range: 4 });

        const results = data.map(row => ({
            category: 'Gmail',
            service: 'Google',
            email: row.Email || row.email,
            password: row.Password || row.password,
            phone: row['Phone Number'] || '',
            remark: row.Remark || ''
        })).filter(item => item.email && item.password);

        if (results.length > 0) {
            console.log(`Found ${results.length} accounts. Importing now...`);
            // InsertMany-r somoy buffering timeout bondho korte ekhanei insert hobe
            await Account.insertMany(results, { ordered: false });
            console.log("Success! Data successfully saved to MongoDB.");
        } else {
            console.log("No valid data found in Excel.");
        }

        await mongoose.connection.close();
        process.exit();
    } catch (err) {
        console.error("Migration Error:", err.message);
        process.exit(1);
    }
};

importExcelData();