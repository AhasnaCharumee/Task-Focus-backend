import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../src/config/db';
import { User } from '../src/models/User';
import bcrypt from 'bcryptjs';

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
    const name = argv.name || process.env.ADMIN_NAME;
    const email = argv.email || process.env.ADMIN_EMAIL;
    const password = argv.password || process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      console.error('Usage: npx ts-node scripts/createAdmin.ts --name "Name" --email you@domain --password "Pass123"');
      process.exit(1);
    }

    await connectDB();

    const exists = await User.findOne({ email });
    if (exists) {
      console.error('User with that email already exists:', email);
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await User.create({ name, email, password: hashed, role: 'admin' });
    const id = (admin as any)?._id && (admin as any)?._id.toString ? (admin as any)._id.toString() : String((admin as any)?._id);
    console.log('Admin created:', { id, email: (admin as any).email, name: (admin as any).name });
    process.exit(0);
  } catch (err: any) {
    console.error('Error creating admin:', err?.message || err);
    process.exit(1);
  }
})();
