"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_1 = __importDefault(require("../src/config/db"));
const User_1 = require("../src/models/User");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
function parseArgs() {
    const args = process.argv.slice(2);
    const out = {};
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a.startsWith('--')) {
            const key = a.slice(2);
            const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
            out[key] = val === undefined ? true : val;
            if (val)
                i++;
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
        await (0, db_1.default)();
        const exists = await User_1.User.findOne({ email });
        if (exists) {
            console.error('User with that email already exists:', email);
            process.exit(1);
        }
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const admin = await User_1.User.create({ name, email, password: hashed, role: 'admin' });
        const id = admin?._id && admin?._id.toString ? admin._id.toString() : String(admin?._id);
        console.log('Admin created:', { id, email: admin.email, name: admin.name });
        process.exit(0);
    }
    catch (err) {
        console.error('Error creating admin:', err?.message || err);
        process.exit(1);
    }
})();
