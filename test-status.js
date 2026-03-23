const { query } = require('./dist/config/database');
(async () => {
    try {
        const res = await query('CALL sp_update_invoice_status($1, $2, null, null)', [1002, 'issued']);
        console.log(res.rows);
    } catch(e) {
        console.error(e);
    }
    process.exit();
})();
