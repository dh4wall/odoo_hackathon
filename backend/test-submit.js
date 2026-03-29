const axios = require('axios');
const FormData = require('form-data');

async function testSubmit() {
    try {
        // 1. Signup a dummy user
        const signupRes = await axios.post('http://localhost:5000/api/auth/signup', {
            email: `test${Date.now()}@test.com`,
            password: "password123",
            name: "Test User",
            company_name: "Test Company",
            country_code: "US"
        });
        const token = signupRes.data.token;

        // 2. Submit expense
        const form = new FormData();
        form.append("description", "A test expense");
        form.append("category", "Travel");
        form.append("date", "2026-03-29");
        form.append("amount", "150.00");
        form.append("currency", "USD");

        // Create a dummy PDF buffer
        form.append("receiptFile", Buffer.from("%PDF-1.4 test file"), { filename: "test.pdf", contentType: "application/pdf" });

        const reimbRes = await axios.post('http://localhost:5000/api/expenses', form, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        console.log("SUCCESS:", reimbRes.data);
    } catch (error) {
        if (error.response) {
            console.log("ERROR:", error.response.status, error.response.data);
        } else {
            console.log("ERROR:", error.message);
        }
    }
}

testSubmit();
