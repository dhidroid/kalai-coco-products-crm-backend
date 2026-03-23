const http = require('http');
const req = http.request('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const data = JSON.parse(body);
    const token = data.data.token;
    console.log('Got token:', !!token);
    
    // Test update
    const patchReq = http.request('http://localhost:3000/api/invoices/1002/status', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    }, res2 => {
      let b = '';
      res2.on('data', d => b += d);
      res2.on('end', () => console.log('Update res:', b));
    });
    patchReq.write(JSON.stringify({ status: 'paid' }));
    patchReq.end();
  });
});
req.write(JSON.stringify({ email: 'admin@kalaicoco.com', password: 'Password@123' }));
req.end();
