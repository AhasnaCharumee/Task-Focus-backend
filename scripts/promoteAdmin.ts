import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../src/config/db';
import { User } from '../src/models/User';

function parseArgs() {
  const args = process.argv.slice(2);
  const out: any = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
      out[key] = val === undefined ? true : val;
      if (val) i++;
    }
  }
  return out;
}

(async () => {
  try {
    const argv = parseArgs();
    const email = argv.email || process.env.ADMIN_EMAIL;

    if (!email) {
      console.error('Usage: npx ts-node --transpile-only scripts/promoteAdmin.ts --email you@domain');
      process.exit(1);
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      console.error('No user found with that email:', email);
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log('User is already admin:', email);
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();

    console.log('User promoted to admin:', { email: user.email, id: user._id?.toString ? user._id.toString() : user._id });
    process.exit(0);
  } catch (err: any) {
    console.error('Error promoting admin:', err?.message || err);
    process.exit(1);
  }
})();
