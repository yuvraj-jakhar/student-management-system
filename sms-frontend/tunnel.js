import localtunnel from 'localtunnel';
import http from 'http';

const PORT = 5173;
const SUBDOMAIN = 'riet-erp-jaipur';

async function getPublicIP() {
  return new Promise((resolve) => {
    http.get('http://api.ipify.org', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => resolve('47.15.68.246'));
  });
}

async function startTunnel() {
  const ip = await getPublicIP();
  console.log(`\n======================================================`);
  console.log(`🚀 RIET JAIPUR ERP - LIVE ONLINE TUNNEL`);
  console.log(`======================================================`);
  console.log(`🔑 Localtunnel Bypass Password (Your Public IP): ${ip}`);
  console.log(`======================================================\n`);

  try {
    const tunnel = await localtunnel({
      port: PORT,
      subdomain: SUBDOMAIN,
    });

    console.log(`🌐 LIVE PUBLIC URL: ${tunnel.url}`);
    console.log(`\n👉 Note: When opening for the first time, Localtunnel will show a security page.`);
    console.log(`👉 Enter the password above (${ip}) and click 'Submit' to access RIET ERP.\n`);

    tunnel.on('close', () => {
      console.log('⚠️ Tunnel closed. Reconnecting in 5 seconds...');
      setTimeout(startTunnel, 5000);
    });

    tunnel.on('error', (err) => {
      console.error('⚠️ Tunnel error:', err.message);
    });
  } catch (err) {
    console.error('❌ Failed to connect tunnel:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
