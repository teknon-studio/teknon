export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function verifyStripeWebhook(rawBody, signature, secret) {
  const [, timestampPart, , signaturePart] = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc.push(key, value);
    return acc;
  }, []);

  const timestamp = signature.split(',').find(p => p.startsWith('t=')).split('=')[1];
  const sigHash = signature.split(',').find(p => p.startsWith('v1=')).split('=')[1];

  const signedPayload = `${timestamp}.${rawBody.toString()}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(signedPayload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  if (expectedSig !== sigHash) throw new Error('Invalid signature');

  const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (timestampAge > 300) throw new Error('Timestamp too old');

  return JSON.parse(rawBody.toString());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).json({ error: 'No signature' });

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = await verifyStripeWebhook(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook verification failed: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.deleted': {
        // Subscription cancelled — nothing to do server-side
        // Access is controlled by verify-subscription.js checking Stripe in real time
        console.log(`Subscription deleted for customer: ${event.data.object.customer}`);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        console.log(`Subscription updated: ${sub.id} status: ${sub.status}`);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed for customer: ${invoice.customer}`);
        break;
      }
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object;
        console.log(`Trial ending soon for customer: ${sub.customer}`);
        break;
      }
      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
