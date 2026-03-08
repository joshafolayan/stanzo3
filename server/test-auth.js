(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'jafolayan03@gmail.com' })
        });
        const contentType = res.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await res.json();
        } else {
            data = await res.text();
        }
        console.log('Status:', res.status);
        console.log('Data:', data);
    } catch (error) {
        console.error('Error fetching API:', error.message);
    }
})();
